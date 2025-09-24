import "./scripts/inlineEmojiPickerScript";
import "./scripts/inlineChatScripts";
import "./scripts/inlineBtnCopyRoomIdScript";

import type {
  CreateMessageDto,
  InnerMessage,
} from "src/chat/dto/create-message.dto";
import type { GetUserDto, RoomsUserValue } from "src/chat/dto/get-user.dto";
import { INVALID_TOKEN } from "src/shared/constants/error-messages";
import {
  ERROR,
  JOIN_ROOM,
  LEAVE_ROOM,
  NEW_MESSAGE,
  ONLINE_USERS,
  REQUEST_ONLINE_USERS,
  STOP_TYPING,
} from "src/shared/constants/socket-events";
import { ACCESS_TOKEN_KEY } from "src/shared/constants/storage";
import { MAX_ROOM_ID_LENGTH } from "src/shared/constants/validation-constraints";

import showToast from "./components/toast";
import handleSendMessage from "./functions/handleSendMessage";
import handleTyping from "./functions/handleTyping";
import handleWebrtc from "./functions/handleWebrtc";
import initChatInputBehavior from "./functions/initChatInputBehavior";
import renderNewMessage, {
  renderNewMessageFromOthers,
} from "./functions/renderNewMessage";
import renderParticipants from "./functions/renderParticipants";
import updateEmptyState from "./functions/updateEmptyState";
import type { Io } from "./types/SocketClient";
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

// io is injected by the socket.io script included in chat.html
declare const io: Io;
const socket = io({
  auth: {
    token: accessToken,
  },
});

socket.on(ERROR, (data: string | string[] | object) => {
  let message: string;

  if (typeof data === "string") {
    message = data;
  } else if (typeof data === "object" && "message" in data) {
    message = JSON.stringify(data);
  } else if (Array.isArray(data)) {
    message = data.join(", ");
  } else {
    message = "An unknown error occurred.";
  }

  if (message === INVALID_TOKEN) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);

    showToast({ message: INVALID_TOKEN, type: "error", duration: 2000 });

    window.location.href = "/";

    return;
  }

  return showToast({ message, type: "error", duration: 2000 });
});

const loadingOverlayRaw = document.getElementById("client-loading");
const messageTextAreaRaw = document.getElementById("message-input");
const sendButtonRaw = document.getElementById("send-button");
const messagesContainerRaw = document.getElementById("messages");
const participantsListRaw = document.getElementById("participant-list");
const countSpanRaw = document.getElementById("participant-count");
const typingIndicatorRaw = document.getElementById("typing-indicator");
const leaveRoomButtonRaw = document.getElementById("leave-button");

const remoteVideosDivRaw = document.getElementById("remote-videos");
const localVideoRaw = document.getElementById("local-video");
const buttonToggleMicRaw = document.getElementById("mute-button");
const buttonToggleVideoRaw = document.getElementById("video-button");
const buttonShareScreenRaw = document.getElementById("share-screen-button");

if (
  !loadingOverlayRaw ||
  !messageTextAreaRaw ||
  !sendButtonRaw ||
  !messagesContainerRaw ||
  !participantsListRaw ||
  !countSpanRaw ||
  !typingIndicatorRaw ||
  !leaveRoomButtonRaw ||
  !remoteVideosDivRaw ||
  !localVideoRaw ||
  !buttonToggleMicRaw ||
  !buttonToggleVideoRaw ||
  !buttonShareScreenRaw
) {
  throw new Error("Missing required DOM elements");
}

const loadingOverlay = loadingOverlayRaw as HTMLDivElement;
const messageTextArea = messageTextAreaRaw as HTMLTextAreaElement;
const sendButton = sendButtonRaw as HTMLButtonElement;
const messagesContainer = messagesContainerRaw as HTMLDivElement;
const participantsList = participantsListRaw as HTMLUListElement;
const countSpan = countSpanRaw as HTMLSpanElement;
const typingIndicator = typingIndicatorRaw as HTMLDivElement;
const leaveRoomButton = leaveRoomButtonRaw as HTMLButtonElement;

const remoteVideosDiv = remoteVideosDivRaw as HTMLDivElement;
const localVideo = localVideoRaw as HTMLVideoElement;
const buttonToggleMic = buttonToggleMicRaw as HTMLButtonElement;
const buttonToggleVideo = buttonToggleVideoRaw as HTMLButtonElement;
const buttonShareScreen = buttonShareScreenRaw as HTMLButtonElement;

leaveRoomButton.disabled = true;
sendButton.disabled = true;

let userId: string | undefined;
let username: string | undefined;

function handleJoinRoom(): void {
  socket.emit(JOIN_ROOM, { roomId }, (user: GetUserDto) => {
    userId = user.userId;
    username = user.username;

    loadingOverlay.style.display = "none";
    leaveRoomButton.disabled = false;

    handleWebrtc({
      socket,
      roomId,
      localVideo,
      remoteVideosContainer: remoteVideosDiv,
      buttonToggleMic,
      buttonToggleVideo,
      buttonShareScreen,
      getUser: () => ({ userId, username }),
      getOnlineUsers: () =>
        // Reuses the last snapshot rendered in the UI (participantsList)
        // Ideal: store internal cache when receiving ONLINE_USERS
        Array.from(participantsList.querySelectorAll("li"))
          .map((li) => li.getAttribute("data-user"))
          .filter(Boolean)
          .map((id) => ({ userId: id as string, username: id as string })),
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.error("WebRTC initialization error:", e);
      showToast({
        message: "Failed to initialize WebRTC.",
        type: "error",
        duration: 4000,
      });
    });

    socket.emit(REQUEST_ONLINE_USERS, { roomId });

    // TEMPORARY solution using roomId as key ID
    // Initialize E2EE
    initE2EE(roomId, roomId)
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

socket.on(ONLINE_USERS, (onlineUsers: RoomsUserValue[]) => {
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
  const { timestamp, cipher, iv } = payload;

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
    const json = await decryptString(cipher, iv, key, aad);

    const inner = JSON.parse(json) as InnerMessage;

    const sender = {
      userId: inner.userId,
      username: inner.username,
    };

    renderNewMessage({
      text: inner.text,
      timestamp,
      messagesContainer,
      sender,
      getUser: () => ({ userId, username }),
    });

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
});

// Initialize chat input behavior (auto-resize, Enter key handling)
initChatInputBehavior({ messageTextArea, sendButton });

sendButton.addEventListener("click", () => {
  socket.emit(STOP_TYPING, { roomId });

  handleSendMessage({
    messageTextArea,
    socket,
    roomId,
    messagesContainer,
    sendButton,
    getUser: () => ({ userId, username }),
  }).catch(() => {
    showToast({
      message: "Failed to send message.",
      type: "error",
      duration: 2000,
    });

    sendButton.disabled = false;
  });
});

handleTyping({
  socket,
  roomId,
  messageTextArea,
  typingIndicator,
  getUser: () => ({ userId, username }),
});
