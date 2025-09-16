interface RenderNewMessageParams {
  sender: string;
  text: string;
  timestamp: number;
  messagesList: HTMLUListElement;
  me: string | undefined;
}

export default function renderNewMessage({
  sender,
  text,
  timestamp,
  messagesList,
  me,
}: RenderNewMessageParams): void {
  if (sender !== me) {
    renderNewMessageFromOthers({ text, timestamp, messagesList, sender });
  } else {
    renderNewMessageFromMe({ text, timestamp, messagesList });
  }
}

type RenderNewMessageFromMeParams = Omit<
  RenderNewMessageParams,
  "me" | "sender"
>;

export function renderNewMessageFromMe({
  text,
  timestamp,
  messagesList,
}: RenderNewMessageFromMeParams): void {
  const div = document.createElement("div");
  div.classList.add(
    "bg-gray-700",
    "p-3",
    "rounded-lg",
    "break-words",
    "lg:text-right",
  );

  const pName = document.createElement("p");
  pName.classList.add("font-semibold", "text-purple-400");

  pName.textContent = "You";

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

  messagesList.appendChild(div);
}

type RenderNewMessageFromOthersParams = Omit<RenderNewMessageParams, "me">;

export function renderNewMessageFromOthers({
  text,
  timestamp,
  messagesList,
  sender,
}: RenderNewMessageFromOthersParams): void {
  const div = document.createElement("div");
  div.classList.add("bg-gray-700", "p-3", "rounded-lg", "break-words");

  const pName = document.createElement("p");
  pName.classList.add("font-semibold", "text-red-400");

  const cleanSender = sender.split("_")[0];
  pName.textContent = cleanSender.toLocaleUpperCase();

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

  messagesList.appendChild(div);
}
