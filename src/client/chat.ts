import type { Socket } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import type { GetUsersOnlineDto } from "src/chat/dto/get-users-online.dto";
import { MAX_ROOM_ID_LENGTH, MAX_USERNAME_LENGTH } from "src/common/constants";

import handleSendMessage from "./functions/handleSendMessage";
import renderNewMessage from "./functions/renderNewMessage";
import renderParticipants from "./functions/renderParticipants";

type Io = (opts?: unknown) => Socket;

declare const io: Io;

const socket = io();

const roomIdInput = document.getElementById("roomId") as HTMLInputElement;
const roomId = roomIdInput.value;

if (roomId.length > MAX_ROOM_ID_LENGTH) {
  window.location.href = "/";
}

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

let me: string | undefined;
let clientIdGetted: string | undefined;

function handleJoinRoom(): void {
  socket.emit(
    "join-room",
    { roomId, username: savedUsername },
    (clientId: string) => {
      me = `${savedUsername}_${clientId}`;
      clientIdGetted = clientId;

      socket.emit("request-online-users", { roomId });
    },
  );
}

handleJoinRoom();

function handleLeaveRoom(): void {
  socket.emit("leave-room", { roomId });
}

// Leave room when the user closes the tab or navigates away
window.addEventListener("beforeunload", handleLeaveRoom);

socket.on("online-users", (onlineUsers: GetUsersOnlineDto[]) => {
  renderParticipants({
    onlineUsers,
    participantsList,
    savedUsername,
    clientIdGetted,
  });
});

socket.on("new-message", (payload: CreateMessageDto) => {
  const { text, sender, timestamp } = payload;

  renderNewMessage({
    sender,
    text,
    timestamp,
    messagesList,
    me,
  });
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
