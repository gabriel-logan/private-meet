import type { GetUserDto } from "src/chat/dto/get-user.dto";

interface RenderNewMessageParams {
  sender: GetUserDto;
  text: string;
  timestamp: number;
  messagesContainer: HTMLDivElement;
  getUser: () => Partial<GetUserDto>;
}

interface RenderMessageParams {
  name: string;
  nameClass: string;
  text: string;
  timestamp: number;
  messagesContainer: HTMLDivElement;
  containerClasses: string[];
}

type RenderNewMessageFromMeParams = Omit<
  RenderNewMessageParams,
  "getUser" | "sender"
>;

type RenderNewMessageFromOthersParams = Omit<RenderNewMessageParams, "getUser">;

export default function renderNewMessage({
  sender,
  text,
  timestamp,
  messagesContainer,
  getUser,
}: RenderNewMessageParams): void {
  const { userId } = getUser();

  if (sender.userId !== userId) {
    renderNewMessageFromOthers({ text, timestamp, messagesContainer, sender });
  } else {
    renderNewMessageFromMe({ text, timestamp, messagesContainer });
  }
}

export function renderMessage({
  name,
  nameClass,
  text,
  timestamp,
  messagesContainer,
  containerClasses,
}: RenderMessageParams): void {
  const div = document.createElement("div");
  div.classList.add(...containerClasses);

  const pName = document.createElement("p");
  pName.classList.add("font-semibold", nameClass);
  pName.textContent = name;

  const pMessage = document.createElement("p");
  pMessage.textContent = text;

  const pTime = document.createElement("p");
  pTime.classList.add("text-xs", "text-gray-400");
  const time = new Date(timestamp);
  pTime.textContent = time.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  div.appendChild(pName);
  div.appendChild(pMessage);
  div.appendChild(pTime);

  messagesContainer.appendChild(div);
}

export function renderNewMessageFromMe({
  text,
  timestamp,
  messagesContainer,
}: RenderNewMessageFromMeParams): void {
  renderMessage({
    name: "You",
    nameClass: "text-purple-400",
    text,
    timestamp,
    messagesContainer,
    containerClasses: [
      "bg-gray-700",
      "p-3",
      "rounded-lg",
      "break-words",
      "lg:text-right",
    ],
  });
}

export function renderNewMessageFromOthers({
  text,
  timestamp,
  messagesContainer,
  sender,
}: RenderNewMessageFromOthersParams): void {
  renderMessage({
    name: sender.username.split("_")[0].toUpperCase(),
    nameClass: "text-red-400",
    text,
    timestamp,
    messagesContainer,
    containerClasses: ["bg-gray-700", "p-3", "rounded-lg", "break-words"],
  });
}
