import showToast from "../components/toast";

const btnCopyRoomIdRaw = document.getElementById("copy-room-id");
const roomIdRaw = document.getElementById("roomId");

if (!btnCopyRoomIdRaw || !roomIdRaw) {
  throw new Error("Copy Room ID button or Room ID input not found");
}

const btnCopyRoomId = btnCopyRoomIdRaw as HTMLButtonElement;
const roomId = roomIdRaw as HTMLInputElement;

btnCopyRoomId.addEventListener("click", () => {
  navigator.clipboard
    .writeText(roomId.value.trim())
    .then(() => {
      btnCopyRoomId.textContent = "Copied!";

      const closeTimeout = 1200;

      // Show temporary p notification
      showToast({
        message: "Room ID copied to clipboard!",
        type: "info",
        duration: closeTimeout,
      });

      setTimeout(() => {
        btnCopyRoomId.textContent = "Copy Room ID";
      }, closeTimeout);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Failed to copy Room ID: ", err);
    });
});
