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
  const div = document.createElement("div");
  div.classList.add("bg-gray-700", "p-3", "rounded-lg", "break-words");

  if (sender === me) {
    div.classList.add("lg:text-right");
  }

  const pName = document.createElement("p");
  pName.classList.add("font-semibold");
  if (sender === me) {
    pName.classList.add("text-purple-400");
  } else {
    pName.classList.add("text-red-400");
  }

  const cleanSender = sender.split("_")[0];
  pName.textContent = sender === me ? "You" : cleanSender.toLocaleUpperCase();

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
