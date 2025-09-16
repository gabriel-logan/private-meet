import type { Socket } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import { MESSAGE } from "src/common/constants/socketEvents";
import { MAX_MESSAGE_LENGTH } from "src/common/constants/validationConstraints";

import { renderNewMessageFromMe } from "./renderNewMessage";

interface HandleSendMessageParams {
  messageInput: HTMLInputElement;
  socket: Socket;
  roomId: string;
  me: string | undefined;
  messagesList: HTMLUListElement;
  sendButton: HTMLButtonElement;
}

export default function handleSendMessage({
  messageInput,
  socket,
  roomId,
  me,
  messagesList,
  sendButton,
}: HandleSendMessageParams): void {
  sendButton.addEventListener("click", () => {
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

    socket.emit(MESSAGE, payload);

    renderNewMessageFromMe({
      text: payload.text,
      timestamp: payload.timestamp,
      messagesList,
    });

    messageInput.value = "";
  });
}
