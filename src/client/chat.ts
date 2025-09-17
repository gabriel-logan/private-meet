import "./scripts/inlineEmojiPickerScript";
import "./scripts/inlineChatScripts";
import "./scripts/inlineBtnCopyRoomIdScript";

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import type { GetUserDto } from "src/chat/dto/get-user.dto";
import { ACCESS_TOKEN_KEY } from "src/common/constants/localstorage";
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
import updateEmptyState from "./functions/updateEmptyState";

const roomIdInput = document.getElementById("roomId") as
  | HTMLInputElement
  | undefined;

const roomId = encodeURIComponent(roomIdInput?.value || "").trim();

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

socket.on(ONLINE_USERS, (onlineUsers: GetUserDto[]) => {
  renderParticipants({
    onlineUsers,
    participantsList,
    savedUsername,
    clientIdGetted,
    countSpan,
  });
});

// Observe changes in the messages list to update the empty state
const messagesObserver = new MutationObserver(() => {
  updateEmptyState({ messagesList });
});
messagesObserver.observe(messagesList, { childList: true });

// Initial check
updateEmptyState({ messagesList });

socket.on(NEW_MESSAGE, (payload: CreateMessageDto) => {
  const { text, sender, timestamp } = payload;

  if (sender !== me) {
    // if the message is from others
    renderNewMessageFromOthers({ text, timestamp, messagesList, sender });
  }

  // Scroll to the bottom when a new message is added
  messagesList.scrollTop = messagesList.scrollHeight;
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevent newline insertion
    sendButton.click(); // Trigger the send button click
  }
});

sendButton.addEventListener("click", () => {
  handleSendMessage({
    messageInput,
    socket,
    roomId,
    me,
    messagesList,
  });
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
