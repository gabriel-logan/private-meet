import type { Socket } from "socket.io-client";
import { STOP_TYPING, TYPING } from "src/common/constants/socketEvents";

interface HandleTypingParams {
  socket: Socket;
  roomId: string;
  username: string | null;
  typingIndicator: HTMLDivElement;
  messageInput: HTMLInputElement;
  timeout?: number; // Optional timeout duration in milliseconds (default is 1500ms)
}

export default function handleTyping({
  socket,
  roomId,
  username,
  typingIndicator,
  messageInput,
  timeout = 1200, // Default timeout
}: HandleTypingParams): void {
  let typing = false;
  let typingTimeout: NodeJS.Timeout | undefined;

  // ---- Internal helper to emit stop typing ----
  function stopTyping(): void {
    if (typing) {
      socket.emit(STOP_TYPING, { roomId, username });
      typing = false;
    }
  }

  // Detect user typing
  messageInput.addEventListener("input", () => {
    if (!username) {
      return;
    }

    if (messageInput.value.length === 0) {
      return stopTyping();
    }

    if (!typing) {
      socket.emit(TYPING, { roomId, username });
      typing = true;
    }

    // Restart the timer every time the user types
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, timeout); // without typing = stopped
  });

  // ---- Render typing from other users ----
  const usersTyping = new Set<string>();

  socket.on(TYPING, ({ username: otherUser }: { username: string }) => {
    if (otherUser === username) return; // do not show typing for myself

    usersTyping.add(otherUser);
    typingIndicator.innerText = `${Array.from(usersTyping).join(", ")} is typing...`;
    typingIndicator.style.display = "block";
  });

  socket.on(STOP_TYPING, ({ username: otherUser }: { username: string }) => {
    if (otherUser === username) return; // ignore myself

    usersTyping.delete(otherUser);
    if (usersTyping.size === 0) {
      typingIndicator.style.display = "none";
    } else {
      typingIndicator.innerText = `${Array.from(usersTyping).join(", ")} is typing...`;
    }
  });
}
