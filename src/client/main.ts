import type { Socket } from "socket.io-client";
import { GENERATE_ROOM_ID } from "src/common/constants/socketEvents";
import {
  MAX_ROOM_ID_LENGTH,
  MAX_USERNAME_LENGTH,
} from "src/common/constants/validationConstraints";

type Io = (opts?: unknown) => Socket;

declare const io: Io;

const socket = io();

const loadingOverlay = document.getElementById(
  "client-loading",
) as HTMLDivElement;

const roomIdInput = document.getElementById(
  "room-id-input",
) as HTMLInputElement;

const userNameInput = document.getElementById(
  "username-input",
) as HTMLInputElement;

const joinRoomBtn = document.getElementById(
  "join-room-button",
) as HTMLButtonElement;

const generateRoomBtn = document.getElementById(
  "generate-room-button",
) as HTMLButtonElement;

generateRoomBtn.disabled = true;
joinRoomBtn.disabled = true;

if (socket.active) {
  loadingOverlay.style.display = "none";
  generateRoomBtn.disabled = false;
  joinRoomBtn.disabled = false;
}

const savedUsername = localStorage.getItem("username");

if (savedUsername) {
  userNameInput.value = savedUsername;
}

function joinRoom(): void {
  const trimedRoomId = roomIdInput.value.trim();
  const trimedUsername = userNameInput.value.trim();

  if (trimedUsername === "") {
    return alert("Please enter a username");
  }

  if (trimedRoomId === "") {
    return alert("Please enter a room ID");
  }

  if (trimedUsername.length > MAX_USERNAME_LENGTH) {
    return alert(
      `Username must be less than ${MAX_USERNAME_LENGTH} characters`,
    );
  }

  if (trimedRoomId.length > MAX_ROOM_ID_LENGTH) {
    return alert(`Room ID must be less than ${MAX_ROOM_ID_LENGTH} characters`);
  }

  // save username to local storage
  localStorage.setItem("username", trimedUsername);

  window.location.href = `/chat?roomId=${trimedRoomId}`;
}

function generateRoomId(): void {
  socket.emit(GENERATE_ROOM_ID, (roomId: string) => {
    roomIdInput.value = roomId;

    navigator.clipboard.writeText(roomId).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Could not copy text: ", err);
    });

    // Show temporary p notification
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg";
    notification.textContent = "Room ID generated and copied to clipboard!";
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 1200);
  });
}

joinRoomBtn.addEventListener("click", joinRoom);

generateRoomBtn.addEventListener("click", generateRoomId);
