import showToast from "../components/toast";

const btnCopyRoomId = document.getElementById(
  "copy-room-id",
) as HTMLButtonElement;
const roomId = document.getElementById("roomId") as HTMLInputElement;

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
