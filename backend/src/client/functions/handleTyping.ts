import type { Socket } from "socket.io-client";
import type { GetUserDto } from "src/chat/dto/get-user.dto";
import { STOP_TYPING, TYPING } from "src/shared/constants/socket-events";

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
  const usersTyping: string[] = [];

  socket.on(TYPING, ({ username: otherUser }: Omit<GetUserDto, "userId">) => {
    usersTyping.push(otherUser);
    typingIndicator.innerText = `${usersTyping.join(", ")} is typing...`;
    typingIndicator.style.display = "block";
  });

  socket.on(
    STOP_TYPING,
    ({ username: otherUser }: Omit<GetUserDto, "userId">) => {
      usersTyping.splice(usersTyping.indexOf(otherUser), 1);
      if (usersTyping.length === 0) {
        typingIndicator.style.display = "none";
      } else {
        typingIndicator.innerText = `${usersTyping.join(", ")} is typing...`;
      }
    },
  );
}
