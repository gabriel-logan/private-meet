import type { Socket } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";

type Io = (opts?: unknown) => Socket;

declare const io: Io;

const messageInput = document.getElementById(
  "message-input",
) as HTMLInputElement;

const sendButton = document.getElementById("send-button") as HTMLButtonElement;

const messagesList = document.getElementById("messages") as HTMLUListElement;

const socket = io();

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
  };

  socket.emit("message", payload);

  messageInput.value = "";
}
