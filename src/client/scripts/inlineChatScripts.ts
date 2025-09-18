const menuIconRaw = document.getElementById("menu-icon");
const participantsRaw = document.getElementById("participants");
const containerRaw = document.getElementById("remote-videos");
const messagesContainerRaw = document.getElementById("messages");

const menuIcon = menuIconRaw as HTMLDivElement | null;
const participants = participantsRaw as HTMLDivElement | null;
const container = containerRaw as HTMLDivElement | null;
const messagesContainer = messagesContainerRaw as HTMLUListElement | null;

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

// Initial calls
updateVideoGrid();
scrollToBottom();

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
