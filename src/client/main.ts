const roomIdInput = document.getElementById(
  "room-id-input",
) as HTMLInputElement;

const joinRoomBtn = document.getElementById(
  "join-room-button",
) as HTMLButtonElement;

joinRoomBtn.addEventListener("click", () => {
  const trimedRoomId = roomIdInput.value.trim();

  if (trimedRoomId === "") {
    return alert("Please enter a room ID");
  }

  window.location.href = `/chat?roomId=${trimedRoomId}`;
});
