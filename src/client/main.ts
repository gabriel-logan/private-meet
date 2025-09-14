import type { CreateRoomDto } from "src/chat/dto/create-room.dto";

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
  if (roomIdInput.value.trim() === "") {
    return alert("Please enter a room ID");
  }

  window.location.href = `/chat?roomId=${roomIdInput.value.trim()}`;
});

createRoomBtn.addEventListener("click", () => {
  void handleCreateRoom();
});

async function handleCreateRoom(): Promise<void> {
  const response = await fetch("/chat/generate-room", { method: "POST" });

  const generatedRoomId = (await response.json()) as CreateRoomDto;

  window.location.href = `/chat?roomId=${generatedRoomId.roomId}`;
}
