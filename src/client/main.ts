import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import { ACCESS_TOKEN_KEY } from "src/common/constants/localstorage";
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

const createUserBtn = document.getElementById(
  "create-user-button",
) as HTMLButtonElement;

const deleteUserBtn = document.getElementById(
  "delete-user-button",
) as HTMLButtonElement;

const userCreationForm = document.getElementById(
  "user-creation-form",
) as HTMLDivElement;

const joinRoomForm = document.getElementById(
  "join-room-form",
) as HTMLDivElement;

generateRoomBtn.disabled = true;
joinRoomBtn.disabled = true;

// ---- Socket connection handling ----
if (socket.active) {
  loadingOverlay.style.display = "none";
  generateRoomBtn.disabled = false;
  joinRoomBtn.disabled = false;
}

// ---- Form visibility logic ----
function renderForms(): void {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (accessToken) {
    userCreationForm.classList.add("hidden");
    joinRoomForm.classList.remove("hidden");

    const savedUsername = localStorage.getItem("username");

    if (savedUsername) {
      userNameInput.value = savedUsername;
    }
  } else {
    joinRoomForm.classList.add("hidden");
    userCreationForm.classList.remove("hidden");
  }
}

renderForms();

// ---- Actions ----
function createUser(): void {
  const username = userNameInput.value.trim();

  if (!username) {
    return showToast({ message: "Please enter a username", type: "error" });
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return showToast({
      message: `Username must be less than ${MAX_USERNAME_LENGTH} characters`,
      type: "error",
    });
  }

  localStorage.setItem("username", username);
  // Fake token until backend ready
  localStorage.setItem(ACCESS_TOKEN_KEY, "fake-token-" + Date.now());
  renderForms();
}

function deleteUser(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem("username");
  renderForms();
}

function joinRoom(): void {
  const roomId = roomIdInput.value.trim();
  const username = localStorage.getItem("username") || "";

  if (!username) {
    return showToast({
      message: "No user found, please create one first",
      type: "error",
    });
  }
  if (!roomId) {
    return showToast({ message: "Please enter a room ID", type: "error" });
  }
  if (roomId.length > MAX_ROOM_ID_LENGTH) {
    return showToast({
      message: `Room ID must be less than ${MAX_ROOM_ID_LENGTH} characters`,
      type: "error",
    });
  }

  const encodedRoomId = encodeURIComponent(roomId);
  window.location.href = `/chat?roomId=${encodedRoomId}`;
}

function generateRoomId(): void {
  socket.emit(GENERATE_ROOM_ID, (roomId: string) => {
    roomIdInput.value = roomId;

    // eslint-disable-next-line no-console
    navigator.clipboard.writeText(roomId).catch(console.error);

    // Show temporary p notification
    showToast({
      message: "Room ID generated and copied to clipboard!",
      type: "success",
      duration: 1200,
    });
  });
}

// ---- Event listeners ----
createUserBtn.addEventListener("click", createUser);
deleteUserBtn.addEventListener("click", deleteUser);
joinRoomBtn.addEventListener("click", joinRoom);
generateRoomBtn.addEventListener("click", generateRoomId);
