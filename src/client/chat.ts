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

const savedUsername = localStorage.getItem("username");

if (!savedUsername) {
  window.location.href = "/";
}

let me: string | undefined;

function handleJoinRoom(): void {
  socket.emit("join-room", { roomId }, (clientId: string) => {
    me = `${savedUsername}_${clientId}`;
  });
}

handleJoinRoom();

function handleLeaveRoom(): void {
  socket.emit("leave-room", { roomId });
}

// Leave room when the user closes the tab or navigates away
window.addEventListener("beforeunload", handleLeaveRoom);

socket.on("new-message", (payload: CreateMessageDto) => {
  const { text, sender, timestamp } = payload;

  const div = document.createElement("div");
  div.classList.add("bg-gray-700", "p-3", "rounded-lg", "break-words");

  if (sender === me) {
    div.classList.add("lg:text-right");
  }

  const pName = document.createElement("p");
  pName.classList.add("font-semibold");
  if (sender === me) {
    pName.classList.add("text-purple-400");
  } else {
    pName.classList.add("text-red-400");
  }

  const cleanSender = sender.split("_")[0];
  pName.textContent = sender === me ? "You" : cleanSender.toLocaleUpperCase();

  const pMessage = document.createElement("p");
  pMessage.textContent = text;

  const pTime = document.createElement("p");
  pTime.classList.add("text-xs", "text-gray-400");
  const time = new Date(timestamp);
  pTime.textContent = time.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  div.appendChild(pName);
  div.appendChild(pMessage);
  div.appendChild(pTime);

  messagesList.appendChild(div);
  messagesList.scrollTop = messagesList.scrollHeight;
});

sendButton.addEventListener("click", handleSendMessage);

function handleSendMessage(): void {
  const message = messageInput.value;

  if (message.trim() === "") {
    return;
  }

  if (!me) {
    alert("User identifier not set.");
    return;
  }

  const payload: CreateMessageDto = {
    text: message,
    roomId: roomId,
    sender: me,
    timestamp: Date.now(),
  };

  socket.emit("message", payload);

  messageInput.value = "";
}
