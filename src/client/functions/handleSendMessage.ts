import type { Socket } from "socket.io-client";
import type { CreateMessageDto } from "src/chat/dto/create-message.dto";
import type { GetUserDto } from "src/chat/dto/get-user.dto";
import { MESSAGE, STOP_TYPING } from "src/common/constants/socket-events";
import { MAX_MESSAGE_LENGTH } from "src/common/constants/validation-constraints";

import showToast from "../components/toast";
import { renderNewMessageFromMe } from "./renderNewMessage";

interface HandleSendMessageParams {
  messageTextArea: HTMLTextAreaElement;
  socket: Socket;
  roomId: string;
  messagesContainer: HTMLDivElement;
  getUser: () => Partial<GetUserDto>;
}

export default function handleSendMessage({
  messageTextArea,
  socket,
  roomId,
  messagesContainer,
  getUser,
}: HandleSendMessageParams): void {
  // Normalize line endings but preserve internal newlines
  const raw = messageTextArea.value.replace(/\r\n/g, "\n");
  const message = raw.trim();

  if (!message) {
    return;
  }

  const { username, userId } = getUser();

  if (!username) {
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
    roomId,
    sender: {
      userId: userId || "",
      username,
    },
    timestamp: Date.now(),
  };

  socket.emit(STOP_TYPING, { roomId });

  socket.emit(MESSAGE, payload);

  renderNewMessageFromMe({
    text: payload.text,
    timestamp: payload.timestamp,
    messagesContainer,
  });

  messageTextArea.value = "";
  messageTextArea.style.height = "auto";
  messageTextArea.style.overflowY = "hidden";
}
