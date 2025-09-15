import type { Socket } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import { MAX_MESSAGE_LENGTH } from "src/common/constants";

interface HandleSendMessageParams {
  messageInput: HTMLInputElement;
  socket: Socket;
  roomId: string;
  me: string | undefined;
}

export default function handleSendMessage({
  messageInput,
  socket,
  roomId,
  me,
}: HandleSendMessageParams): void {
  const message = messageInput.value;

  if (message.trim() === "") {
    return;
  }

  if (!me) {
    return alert("User identifier not set.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return alert(
      `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`,
    );
  }

  const payload: CreateMessageDto = {
    text: message,
    roomId: roomId,
    sender: me,
    timestamp: Date.now(),
  };

  socket.emit("message", payload);

  messageInput.value = "";
}
