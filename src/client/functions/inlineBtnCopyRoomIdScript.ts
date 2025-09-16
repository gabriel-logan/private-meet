const btnCopyRoomId = document.getElementById(
  "copy-room-id",
) as HTMLButtonElement;
const roomId = document.getElementById("roomId") as HTMLInputElement;

btnCopyRoomId.addEventListener("click", () => {
  navigator.clipboard
    .writeText(roomId.value)
    .then(() => {
      btnCopyRoomId.textContent = "Copied!";

      // Show temporary p notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg";
      notification.textContent = "Room ID copied to clipboard!";
      document.body.appendChild(notification);

      setTimeout(() => {
        btnCopyRoomId.textContent = "Copy Room ID";
        document.body.removeChild(notification);
      }, 1200);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Failed to copy Room ID: ", err);
    });
});
