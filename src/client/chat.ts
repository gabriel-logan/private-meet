import type { Socket } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";

type Io = (opts?: unknown) => Socket;

declare const io: Io;

const socket = io();

const roomIdInput = document.getElementById("roomId") as HTMLInputElement;
const roomId = roomIdInput.value;

const messageInput = document.getElementById(
  "message-input",
) as HTMLInputElement;

const sendButton = document.getElementById("send-button") as HTMLButtonElement;

const messagesList = document.getElementById("messages") as HTMLUListElement;

/**
socket.emit("join-room", { roomId });

// Leave room when the user closes the tab or navigates away
window.addEventListener("beforeunload", () => {
  socket.emit("leave-room", { roomId });
});
*/

socket.on("new-message", (payload: CreateMessageDto) => {
  const { text } = payload;

  const listItem = document.createElement("li");
  listItem.textContent = text;

  messagesList.appendChild(listItem);
});

sendButton.addEventListener("click", handleSendMessage);

function handleSendMessage(): void {
  const message = messageInput.value;

  if (message.trim() === "") {
    return;
  }

  const payload: CreateMessageDto = {
    text: message,
    roomId: roomId,
  };

  socket.emit("message", payload);

  messageInput.value = "";
}
