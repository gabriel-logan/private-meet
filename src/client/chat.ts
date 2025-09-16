import "./scripts/inlineChatScripts";
import "./scripts/inlineBtnCopyRoomIdScript";

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import type { GetUsersOnlineDto } from "src/chat/dto/get-users-online.dto";
import {
  JOIN_ROOM,
  LEAVE_ROOM,
  NEW_MESSAGE,
  ONLINE_USERS,
  REQUEST_ONLINE_USERS,
  STOP_TYPING,
  TYPING,
} from "src/common/constants/socketEvents";
import {
  MAX_ROOM_ID_LENGTH,
  MAX_USERNAME_LENGTH,
} from "src/common/constants/validationConstraints";

import handleSendMessage from "./functions/handleSendMessage";
import type { TypingData } from "./functions/handleTyping";
import handleTyping from "./functions/handleTyping";
import { renderNewMessageFromOthers } from "./functions/renderNewMessage";
import renderParticipants from "./functions/renderParticipants";

type Io = (opts?: Partial<ManagerOptions & SocketOptions>) => Socket;

declare const io: Io;

const socket = io();

const roomIdInput = document.getElementById("roomId") as
  | HTMLInputElement
  | undefined;

const roomId = encodeURIComponent(roomIdInput?.value || "").trim();

if (roomId.length > MAX_ROOM_ID_LENGTH) {
  window.location.href = "/";
}

const loadingOverlay = document.getElementById(
  "client-loading",
) as HTMLDivElement;

const messageInput = document.getElementById(
  "message-input",
) as HTMLInputElement;

const sendButton = document.getElementById("send-button") as HTMLButtonElement;

const messagesList = document.getElementById("messages") as HTMLUListElement;

const participantsList = document.getElementById(
  "participant-list",
) as HTMLUListElement;

const countSpan = document.getElementById(
  "participant-count",
) as HTMLSpanElement;

const typingIndicator = document.getElementById(
  "typing-indicator",
) as HTMLDivElement;

const savedUsername = localStorage.getItem("username");

if (!savedUsername?.trim() || savedUsername.length > MAX_USERNAME_LENGTH) {
  window.location.href = "/";
}

sendButton.disabled = true;

let me: string | undefined;
let clientIdGetted: string | undefined;

function handleJoinRoom(): void {
  socket.emit(
    JOIN_ROOM,
    { roomId, username: savedUsername },
    (clientId: string) => {
      me = `${savedUsername}_${clientId}`;
      clientIdGetted = clientId;

      loadingOverlay.style.display = "none";
      sendButton.disabled = false;

      socket.emit(REQUEST_ONLINE_USERS, { roomId });
    },
  );
}

handleJoinRoom();

function handleLeaveRoom(): void {
  socket.emit(LEAVE_ROOM, { roomId });
}

// Leave room when the user closes the tab or navigates away
window.addEventListener("beforeunload", handleLeaveRoom);

socket.on(ONLINE_USERS, (onlineUsers: GetUsersOnlineDto[]) => {
  renderParticipants({
    onlineUsers,
    participantsList,
    savedUsername,
    clientIdGetted,
    countSpan,
  });
});

// ---- Empty state for messages ----
const placeholder = document.createElement("div");
placeholder.id = "no-messages-placeholder";
placeholder.className = "text-center text-gray-400 mt-10";
placeholder.textContent = "No messages yet. Start the conversation!";

function updateEmptyState(): void {
  const hasRealMessages = Array.from(messagesList.children).some(
    (el) => el !== placeholder,
  );
  if (!hasRealMessages) {
    if (!messagesList.contains(placeholder)) {
      messagesList.appendChild(placeholder);
    }
    placeholder.style.display = "block";
  } else if (placeholder.parentElement) {
    placeholder.style.display = "none";
  }
}

// Observe changes in the messages list to update the empty state
const messagesObserver = new MutationObserver(updateEmptyState);
messagesObserver.observe(messagesList, { childList: true });

// Initial check
updateEmptyState();

socket.on(NEW_MESSAGE, (payload: CreateMessageDto) => {
  const { text, sender, timestamp } = payload;

  if (sender !== me) {
    // if the message is from others
    renderNewMessageFromOthers({ text, timestamp, messagesList, sender });
  }

  updateEmptyState();
  // Scroll to the bottom when a new message is added
  messagesList.scrollTop = messagesList.scrollHeight;
});

sendButton.addEventListener("click", () => {
  handleSendMessage({
    messageInput,
    socket,
    roomId,
    me,
    messagesList,
  });
  updateEmptyState();
});

handleTyping({
  socket,
  roomId,
  username: savedUsername,
  typingIndicator,
  messageInput,
});

// ---- Render typing from other users ----
const usersTyping = new Set<string>();

socket.on(TYPING, ({ username: otherUser, clientId }: TypingData) => {
  if (otherUser === savedUsername && clientId === clientIdGetted) {
    return;
  } // do not show typing for myself

  usersTyping.add(otherUser);
  typingIndicator.innerText = `${Array.from(usersTyping).join(", ")} is typing...`;
  typingIndicator.style.display = "block";
});

socket.on(STOP_TYPING, ({ username: otherUser, clientId }: TypingData) => {
  if (otherUser === savedUsername && clientId === clientIdGetted) {
    return;
  } // ignore myself

  usersTyping.delete(otherUser);
  if (usersTyping.size === 0) {
    typingIndicator.style.display = "none";
  } else {
    typingIndicator.innerText = `${Array.from(usersTyping).join(", ")} is typing...`;
  }
});
