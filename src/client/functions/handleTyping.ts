import type { Socket } from "socket.io-client";
import type { GetUserDto } from "src/chat/dto/get-user.dto";
import { STOP_TYPING, TYPING } from "src/common/constants/socket-events";

interface HandleTypingParams {
  socket: Socket;
  roomId: string;
  messageTextArea: HTMLTextAreaElement;
  typingIndicator: HTMLDivElement;
  getUser: () => Partial<GetUserDto>;
}

export default function handleTyping({
  socket,
  roomId,
  messageTextArea,
  typingIndicator,
  getUser,
}: HandleTypingParams): void {
  let typing = false;
  let typingTimeout: ReturnType<typeof setTimeout>;

  // ---- Internal helper to emit stop typing ----
  function stopTyping(): void {
    if (typing) {
      socket.emit(STOP_TYPING, { roomId });
      typing = false;
    }
  }

  // Detect user typing
  messageTextArea.addEventListener("input", () => {
    const { username } = getUser();

    if (!username) {
      return;
    }

    if (messageTextArea.value.length === 0) {
      return stopTyping();
    }

    if (!typing) {
      socket.emit(TYPING, { roomId });
      typing = true;
    }

    // Restart the timer every time the user types
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, 1200); // without typing = stopped
  });

  // ---- Render typing from other users ----
  const usersTyping = new Set<string>();

  socket.on(
    TYPING,
    ({ username: otherUser, userId: otherUserId }: GetUserDto) => {
      const { username, userId } = getUser();

      if (otherUser === username && otherUserId === userId) {
        return;
      } // do not show typing for myself

      usersTyping.add(otherUser);
      typingIndicator.innerText = `${Array.from(usersTyping).join(", ")} is typing...`;
      typingIndicator.style.display = "block";
    },
  );

  socket.on(
    STOP_TYPING,
    ({ username: otherUser, userId: otherUserId }: GetUserDto) => {
      const { username, userId } = getUser();

      if (otherUser === username && otherUserId === userId) {
        return;
      } // ignore myself

      usersTyping.delete(otherUser);
      if (usersTyping.size === 0) {
        typingIndicator.style.display = "none";
      } else {
        typingIndicator.innerText = `${Array.from(usersTyping).join(", ")} is typing...`;
      }
    },
  );
}
