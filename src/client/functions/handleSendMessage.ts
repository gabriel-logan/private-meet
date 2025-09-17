import type { Socket } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import { MESSAGE } from "src/common/constants/socketEvents";
import { MAX_MESSAGE_LENGTH } from "src/common/constants/validationConstraints";

import showToast from "../components/toast";
import { renderNewMessageFromMe } from "./renderNewMessage";

interface HandleSendMessageParams {
  messageInput: HTMLInputElement;
  socket: Socket;
  roomId: string;
  me: string | undefined;
  messagesList: HTMLUListElement;
}

export default function handleSendMessage({
  messageInput,
  socket,
  roomId,
  me,
  messagesList,
}: HandleSendMessageParams): void {
  const message = messageInput.value;

  if (message.trim() === "") {
    return;
  }

  if (!me) {
    return showToast({
      message: "User identifier not set.",
      type: "info",
      duration: 2000,
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return showToast({
      message: `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`,
      type: "warn",
      duration: 2000,
    });
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
}
