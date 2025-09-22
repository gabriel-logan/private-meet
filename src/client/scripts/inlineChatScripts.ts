const menuIconRaw = document.getElementById("menu-icon");
const participantsRaw = document.getElementById("participants");
const videoContainerRaw = document.getElementById("remote-videos");
const messagesContainerRaw = document.getElementById("messages");

if (!videoContainerRaw) {
  throw new Error("Remote videos videoContainer not found");
}

const menuIcon = menuIconRaw as HTMLDivElement | null;
const participants = participantsRaw as HTMLDivElement | null;
const videoContainer = videoContainerRaw as HTMLDivElement;
const messagesContainer = messagesContainerRaw as HTMLDivElement | null;

function updateVideoGrid(): void {
  const count = Array.from(videoContainer.children).filter(
    (c) => (c as HTMLElement).tagName === "VIDEO" || c.querySelector("video"),
  ).length;

  if (count === 0) {
    return;
  }

  // Define columns
  let cols = Math.ceil(Math.sqrt(count));

  // Force 1 column on small screens
  if (window.innerWidth < 640) {
    cols = 1;
  }

  videoContainer.classList.add(`grid-cols-${cols}`);
}

function scrollToBottom(): void {
  if (!messagesContainer) {
    throw new Error("Messages messagesContainer not found");
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
const observer = new MutationObserver(() => {
  requestAnimationFrame(updateVideoGrid);
});

observer.observe(videoContainer, {
  childList: true,
  subtree: true,
});

// Observe changes in videos (entry/exit)
if (messagesContainer) {
  observer.observe(messagesContainer, { childList: true, subtree: true });
}

// Recalculate on resize
window.addEventListener("resize", () => {
  requestAnimationFrame(updateVideoGrid);
});

// Expose for debugging if needed
// (window as any).forceVideoGridUpdate = updateVideoGrid;
