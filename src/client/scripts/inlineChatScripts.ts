import observer from "../utils/observer";

const menuIconRaw = document.getElementById("menu-icon");
const participantsRaw = document.getElementById("participants");
const videoContainerRaw = document.getElementById("remote-videos");

if (!videoContainerRaw) {
  throw new Error("Remote videos videoContainer not found");
}

const menuIcon = menuIconRaw as HTMLDivElement | null;
const participants = participantsRaw as HTMLDivElement | null;
const videoContainer = videoContainerRaw as HTMLDivElement;

let lastGridColsClass: string | null = null;

function updateVideoGrid(): void {
  const count = Array.from(videoContainer.children).filter(
    (c) => c.tagName === "VIDEO" || !!c.querySelector("video"),
  ).length;

  // Cleanup previous
  if (lastGridColsClass) {
    videoContainer.style.gridTemplateColumns = "";
    lastGridColsClass = null;
  }

  if (count === 0) {
    return;
  }

  // Define columns
  let cols = Math.ceil(Math.sqrt(count));

  // Force 1 column on small screens
  if (window.innerWidth < 640) {
    cols = 1;
  }

  videoContainer.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  lastGridColsClass = `grid-cols-${cols}`;
}

if (!menuIcon || !participants) {
  throw new Error("Menu icon or participants element not found");
}

// Initial calls
updateVideoGrid();

const obs = observer(() => {
  requestAnimationFrame(updateVideoGrid);
});

obs.observe(videoContainer, {
  childList: true,
  subtree: true,
});

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
