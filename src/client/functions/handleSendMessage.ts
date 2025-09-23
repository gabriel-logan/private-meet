import type { Socket } from "socket.io-client";
import type {
  CreateMessageDto,
  InnerMessage,
} from "src/chat/dto/create-message.dto";
import type { GetUserDto } from "src/chat/dto/get-user.dto";
import { MESSAGE } from "src/shared/constants/socket-events";
import { MAX_MESSAGE_LENGTH } from "src/shared/constants/validation-constraints";

import showToast from "../components/toast";
import { aadFrom, encryptString, getCachedKey } from "../utils/e2ee";
import { renderNewMessageFromMe } from "./renderNewMessage";

interface HandleSendMessageParams {
  messageTextArea: HTMLTextAreaElement;
  socket: Socket;
  roomId: string;
  messagesContainer: HTMLDivElement;
  getUser: () => Partial<GetUserDto>;
}

export default async function handleSendMessage({
  messageTextArea,
  socket,
  roomId,
  messagesContainer,
  getUser,
}: HandleSendMessageParams): Promise<void> {
  // Normalize line endings but preserve internal newlines
  const raw = messageTextArea.value.replace(/\r\n/g, "\n");
  const message = raw.trim();

  if (!message) {
    return;
  }

  const { username, userId } = getUser();

  if (!username || !userId) {
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

  const key = getCachedKey();
  if (!key) {
    return showToast({
      message: "E2EE key not set.",
      type: "error",
      duration: 2000,
    });
  }

  const innerMessage: InnerMessage = {
    text: message,
    userId,
    username,
  };

  const aad = aadFrom(roomId);

  const { iv, content, alg } = await encryptString(
    JSON.stringify(innerMessage),
    key,
    aad,
  );

  const payload: CreateMessageDto = {
    roomId,
    cipher: content,
    iv,
    alg,
    timestamp: Date.now(), // Will be replaced by server
  };

  socket.emit(MESSAGE, payload, (response: { ok?: boolean }) => {
    if (response.ok) {
      renderNewMessageFromMe({
        text: message,
        timestamp: payload.timestamp,
        messagesContainer,
      });

      messageTextArea.value = "";
      messageTextArea.style.height = "auto";
      messageTextArea.style.overflowY = "hidden";

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
}
