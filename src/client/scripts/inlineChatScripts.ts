// Toggle sidebar (mobile)
const menuIcon = document.getElementById("menu-icon") as HTMLDivElement | null;
const participants = document.getElementById(
  "participants",
) as HTMLDivElement | null;

const container = document.getElementById(
  "remote-videos",
) as HTMLDivElement | null;

const messagesContainer = document.getElementById(
  "messages",
) as HTMLUListElement | null;

function updateVideoGrid(): void {
  if (!container) {
    throw new Error("Remote videos container not found");
  }

  const videos = container.children.length;

  // Define colunas
  const cols = Math.ceil(Math.sqrt(videos));
  container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  // Ajusta a altura de cada linha
  const rows = Math.ceil(videos / cols);
  container.style.gridAutoRows = `calc(100% / ${rows} - 1rem)`;
}

function scrollToBottom(): void {
  if (!messagesContainer) {
    throw new Error("Messages container not found");
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

if (!menuIcon || !participants) {
  throw new Error("Menu icon or participants element not found");
}

menuIcon.addEventListener("click", () => {
  participants.classList.toggle("-translate-x-full");
});

// When clicking outside the sidebar, close it (mobile)
document.addEventListener("click", (event) => {
  if (
    !participants.contains(event.target as Node) &&
    !menuIcon.contains(event.target as Node)
  ) {
    participants.classList.add("-translate-x-full");
  }
});

updateVideoGrid();

scrollToBottom();
