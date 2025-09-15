import {
  MAX_ROOM_ID_LENGTH,
  MAX_USERNAME_LENGTH,
} from "src/common/constants/validationConstraints";

const roomIdInput = document.getElementById(
  "room-id-input",
) as HTMLInputElement;

const userNameInput = document.getElementById(
  "username-input",
) as HTMLInputElement;

const joinRoomBtn = document.getElementById(
  "join-room-button",
) as HTMLButtonElement;

const savedUsername = localStorage.getItem("username");

if (savedUsername) {
  userNameInput.value = savedUsername;
}

joinRoomBtn.addEventListener("click", () => {
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
});
