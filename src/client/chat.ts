import "./functions/inlineChatScripts";

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import type { GetUsersOnlineDto } from "src/chat/dto/get-users-online.dto";
import {
  JOIN_ROOM,
  LEAVE_ROOM,
  NEW_MESSAGE,
  ONLINE_USERS,
  REQUEST_ONLINE_USERS,
} from "src/common/constants/socketEvents";
import {
  MAX_ROOM_ID_LENGTH,
  MAX_USERNAME_LENGTH,
} from "src/common/constants/validationConstraints";

import handleSendMessage from "./functions/handleSendMessage";
import { renderNewMessageFromOthers } from "./functions/renderNewMessage";
import renderParticipants from "./functions/renderParticipants";

type Io = (opts?: Partial<ManagerOptions & SocketOptions>) => Socket;

declare const io: Io;

const socket = io();

const roomIdInput = document.getElementById("roomId") as HTMLInputElement;
const roomId = roomIdInput.value;

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
  });
});

socket.on(NEW_MESSAGE, (payload: CreateMessageDto) => {
  const { text, sender, timestamp } = payload;

  if (sender !== me) {
    // if the message is from others
    renderNewMessageFromOthers({ text, timestamp, messagesList, sender });
  }

  messagesList.scrollTop = messagesList.scrollHeight;
});

sendButton.addEventListener("click", () =>
  handleSendMessage({
    messageInput,
    socket,
    roomId,
    me,
  }),
);
