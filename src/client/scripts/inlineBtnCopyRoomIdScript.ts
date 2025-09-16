import showToast from "../components/toast";

const btnCopyRoomId = document.getElementById(
  "copy-room-id",
) as HTMLButtonElement | null;
const roomId = document.getElementById("roomId") as HTMLInputElement | null;

if (!btnCopyRoomId || !roomId) {
  throw new Error("Copy Room ID button or Room ID input not found");
}

btnCopyRoomId.addEventListener("click", () => {
  navigator.clipboard
    .writeText(roomId.value)
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
