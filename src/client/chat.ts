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

const participantsList = document.getElementById(
  "participant-list",
) as HTMLUListElement;

const savedUsername = localStorage.getItem("username");

if (!savedUsername) {
  window.location.href = "/";
}

let me: string | undefined;
let clientIdGetted: string | undefined;

function handleJoinRoom(): void {
  socket.emit("join-room", { roomId }, (clientId: string) => {
    me = `${savedUsername}_${clientId}`;
    clientIdGetted = clientId;
  });
}

handleJoinRoom();

function handleLeaveRoom(): void {
  socket.emit("leave-room", { roomId });
}

socket.on("online-users", (onlineUsers: string[]) => {
  const quantity = onlineUsers.length - 1;
  const countSpan = document.getElementById(
    "participant-count",
  ) as HTMLSpanElement;
  countSpan.textContent = `(${quantity})`;

  // Clear the current list
  participantsList.innerHTML = "";

  // Add "You" (the current user) to the list
  const li = document.createElement("li");
  li.textContent = `You (${savedUsername}): ${clientIdGetted}`;
  li.classList.add(
    "font-medium",
    "text-indigo-400",
    "mb-2",
    "border-b",
    "border-gray-600",
    "pb-2",
  );
  participantsList.appendChild(li);

  // Filter out the current user from the online users list
  const otherUsers = onlineUsers.filter((user) => user !== clientIdGetted);

  // Add the other online users to the list
  otherUsers.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    li.classList.add("font-semibold", "text-green-400");
    participantsList.appendChild(li);
  });
});

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
    return alert("User identifier not set.");
  }

  if (message.length > 500) {
    return alert("Message is too long. Maximum length is 500 characters.");
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
