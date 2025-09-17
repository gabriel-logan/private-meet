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

export interface TypingData {
  userId: string;
  username: string;
}

export default function handleTyping({
  socket,
  roomId,
  username,
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
}
