import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import { GENERATE_ROOM_ID } from "src/common/constants/socketEvents";
import {
  MAX_ROOM_ID_LENGTH,
  MAX_USERNAME_LENGTH,
} from "src/common/constants/validationConstraints";

import showToast from "./components/toast";

type Io = (opts?: Partial<ManagerOptions & SocketOptions>) => Socket;

// io is injected by the socket.io script included in main.html
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
    return showToast({
      message: "Please enter a username",
      type: "error",
    });
  }

  if (trimedRoomId === "") {
    return showToast({
      message: "Please enter a room ID",
      type: "error",
    });
  }

  if (trimedUsername.length > MAX_USERNAME_LENGTH) {
    return showToast({
      message: `Username must be less than ${MAX_USERNAME_LENGTH} characters`,
      type: "error",
    });
  }

  if (trimedRoomId.length > MAX_ROOM_ID_LENGTH) {
    return showToast({
      message: `Room ID must be less than ${MAX_ROOM_ID_LENGTH} characters`,
      type: "error",
    });
  }

  // save username to local storage
  localStorage.setItem("username", trimedUsername);

  const encodedRoomId = encodeURIComponent(trimedRoomId);

  window.location.href = `/chat?roomId=${encodedRoomId}`;
}

function generateRoomId(): void {
  socket.emit(GENERATE_ROOM_ID, (roomId: string) => {
    roomIdInput.value = roomId;

    navigator.clipboard.writeText(roomId).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Could not copy text: ", err);
    });

    // Show temporary p notification
    showToast({
      message: "Room ID generated and copied to clipboard!",
      type: "success",
      duration: 1200,
    });
  });
}

joinRoomBtn.addEventListener("click", joinRoom);

generateRoomBtn.addEventListener("click", generateRoomId);
