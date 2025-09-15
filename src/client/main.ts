import type { Socket } from "socket.io-client";

type Io = (opts?: unknown) => Socket;

declare const io: Io;

const socket = io();

const roomIdInput = document.getElementById(
  "room-id-input",
) as HTMLInputElement;

const joinRoomBtn = document.getElementById(
  "join-room-button",
) as HTMLButtonElement;

const createRoomBtn = document.getElementById(
  "create-room-button",
) as HTMLButtonElement;

joinRoomBtn.addEventListener("click", () => {
  const trimedRoomId = roomIdInput.value.trim();

  if (trimedRoomId === "") {
    return alert("Please enter a room ID");
  }

  socket.emit(
    "verify-room",
    { roomId: trimedRoomId },
    (isRoomExists: boolean) => {
      if (!isRoomExists) {
        return alert("Invalid Room ID, please check and try again");
      }

      window.location.href = `/chat?roomId=${trimedRoomId}`;
    },
  );
});

createRoomBtn.addEventListener("click", handleCreateRoom);

function handleCreateRoom(): void {
  socket.emit("generate-room", (roomId: string) => {
    window.location.href = `/chat?roomId=${roomId}`;
  });
}
