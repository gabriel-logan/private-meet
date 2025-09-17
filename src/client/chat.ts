import "./scripts/inlineEmojiPickerScript";
import "./scripts/inlineChatScripts";
import "./scripts/inlineBtnCopyRoomIdScript";

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type {
  CreateMessageDto,
  InnerMessage,
} from "src/chat/dto/create-message.dto";
import type { GetUserDto } from "src/chat/dto/get-user.dto";
import { INVALID_TOKEN } from "src/common/constants/error-messages";
import {
  ERROR,
  JOIN_ROOM,
  LEAVE_ROOM,
  NEW_MESSAGE,
  ONLINE_USERS,
  REQUEST_ONLINE_USERS,
} from "src/common/constants/socket-events";
import { ACCESS_TOKEN_KEY } from "src/common/constants/storage";
import { MAX_ROOM_ID_LENGTH } from "src/common/constants/validation-constraints";

import showToast from "./components/toast";
import handleSendMessage from "./functions/handleSendMessage";
import handleTyping from "./functions/handleTyping";
import initChatInputBehavior from "./functions/initChatInputBehavior";
import { renderNewMessageFromOthers } from "./functions/renderNewMessage";
import renderParticipants from "./functions/renderParticipants";
import updateEmptyState from "./functions/updateEmptyState";
import { aadFrom, decryptString, getCachedKey, initE2EE } from "./utils/e2ee";

const roomIdInput = document.getElementById("roomId") as
  | HTMLInputElement
  | undefined;

const roomIdTrimmed = (roomIdInput?.value || "").trim();

const roomId = encodeURIComponent(roomIdTrimmed);

const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

if (roomId.length > MAX_ROOM_ID_LENGTH || !accessToken) {
  window.location.href = "/";
}

type Io = (opts?: Partial<ManagerOptions & SocketOptions>) => Socket;

// io is injected by the socket.io script included in chat.html
declare const io: Io;
const socket = io({
  auth: {
    token: accessToken,
  },
});

socket.on(ERROR, (message: string) => {
  if (message === INVALID_TOKEN) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);

    showToast({ message: INVALID_TOKEN, type: "error", duration: 2000 });

    window.location.href = "/";

    return;
  }

  showToast({ message, type: "error", duration: 2000 });
});

const loadingOverlay = document.getElementById(
  "client-loading",
) as HTMLDivElement;

const messageTextArea = document.getElementById(
  "message-input",
) as HTMLTextAreaElement;

const sendButton = document.getElementById("send-button") as HTMLButtonElement;

const messagesContainer = document.getElementById("messages") as HTMLDivElement;

const participantsList = document.getElementById(
  "participant-list",
) as HTMLUListElement;

const countSpan = document.getElementById(
  "participant-count",
) as HTMLSpanElement;

const typingIndicator = document.getElementById(
  "typing-indicator",
) as HTMLDivElement;

const leaveRoomButton = document.getElementById(
  "leave-button",
) as HTMLButtonElement;

leaveRoomButton.disabled = true;
sendButton.disabled = true;

let userId: string | undefined;
let username: string | undefined;

const passphrase = prompt("Enter your passphrase for E2EE: ");

if (!passphrase) {
  showToast({
    message: "Passphrase is required for E2EE.",
    type: "error",
    duration: 4000,
  });

  window.location.reload();
}

function handleJoinRoom(): void {
  socket.emit(JOIN_ROOM, { roomId }, (user: GetUserDto) => {
    userId = user.userId;
    username = user.username;

    loadingOverlay.style.display = "none";
    leaveRoomButton.disabled = false;

    socket.emit(REQUEST_ONLINE_USERS, { roomId });

    initE2EE(passphrase as string, roomId)
      .then(() => {
        sendButton.disabled = false;
      })
      .catch(() => {
        showToast({
          message: "Failed to initialize E2EE.",
          type: "error",
          duration: 4000,
        });
      });
  });
}

handleJoinRoom();

function handleLeaveRoom(): void {
  socket.emit(LEAVE_ROOM, { roomId });
}

// Leave room when the user closes the tab or navigates away
window.addEventListener("beforeunload", handleLeaveRoom);
leaveRoomButton.addEventListener("click", () => {
  handleLeaveRoom();

  window.location.href = "/";
});
socket.on("disconnect", () => {
  // eslint-disable-next-line no-console
  console.log("Disconnected from server");

  leaveRoomButton.disabled = true;
  sendButton.disabled = true;

  handleLeaveRoom();
});

socket.on(ONLINE_USERS, (onlineUsers: GetUserDto[]) => {
  renderParticipants({
    onlineUsers,
    participantsList,
    countSpan,
    getUser: () => ({ userId, username }),
  });
});

// Observe changes in the messages container to update the empty state
const messagesObserver = new MutationObserver(() => {
  updateEmptyState({ messagesContainer });
});
messagesObserver.observe(messagesContainer, { childList: true });

// Initial check
updateEmptyState({ messagesContainer });

socket.on(NEW_MESSAGE, async (payload: CreateMessageDto) => {
  const { timestamp } = payload;

  // New encrypted case
  if (payload.cipher && payload.iv) {
    const key = getCachedKey();

    if (!key) {
      renderNewMessageFromOthers({
        text: "[Protected message: E2EE not configured]",
        timestamp,
        messagesContainer,
        sender: { userId: "unknown", username: "unknown" },
      });

      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      return;
    }

    try {
      const aad = aadFrom(roomId);
      const json = await decryptString(payload.cipher, payload.iv, key, aad);

      const inner = JSON.parse(json) as InnerMessage;

      const sender = {
        userId: inner.userId,
        username: inner.username,
      };

      // If the message is from another user, render as "others"
      if (sender.userId !== userId) {
        renderNewMessageFromOthers({
          text: inner.text,
          timestamp,
          messagesContainer,
          sender,
        });
      }

      return;
    } catch {
      renderNewMessageFromOthers({
        text: "[Protected message: failed to decrypt]",
        timestamp,
        messagesContainer,
        sender: { userId: "unknown", username: "unknown" },
      });

      return;
    } finally {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
});

// Initialize chat input behavior (auto-resize, Enter key handling)
initChatInputBehavior({ messageTextArea, sendButton });

sendButton.addEventListener("click", () => {
  void handleSendMessage({
    messageTextArea,
    socket,
    roomId,
    messagesContainer,
    getUser: () => ({ userId, username }),
  });

  // After sending, reset the textarea height
  messageTextArea.style.height = "auto";
  messageTextArea.style.overflowY = "hidden";
});

handleTyping({
  socket,
  roomId,
  messageTextArea,
  typingIndicator,
  getUser: () => ({ userId, username }),
});
