// Toggle sidebar (mobile)
const menuIcon = document.getElementById("menu-icon") as HTMLDivElement;
const participants = document.getElementById("participants") as HTMLDivElement;

function updateVideoGrid(): void {
  const container = document.getElementById("remote-videos") as HTMLDivElement;
  const videos = container.children.length;

  // Define colunas
  const cols = Math.ceil(Math.sqrt(videos));
  container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  // Ajusta a altura de cada linha
  const rows = Math.ceil(videos / cols);
  container.style.gridAutoRows = `calc(100% / ${rows} - 1rem)`;
}

const messagesContainer = document.getElementById(
  "messages",
) as HTMLUListElement;

function scrollToBottom(): void {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
