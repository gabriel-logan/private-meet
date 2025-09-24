import { isMobile } from "../utils/responsiveness";

const emojiBtnRaw = document.getElementById("emoji-toggle");
const emojiPickerRaw = document.getElementById("emoji-picker");
const closeBtnRaw = document.getElementById("emoji-close");
const messageInputRaw = document.getElementById("message-input");

if (!emojiBtnRaw || !emojiPickerRaw || !messageInputRaw || !closeBtnRaw) {
  throw new Error("Emoji picker elements not found");
}

const emojiBtn = emojiBtnRaw as HTMLButtonElement;
const emojiPicker = emojiPickerRaw as HTMLDivElement;
const closeBtn = closeBtnRaw as HTMLButtonElement;
const messageInput = messageInputRaw as HTMLInputElement;

function insertAtCursor(el: HTMLInputElement, text: string): void {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;

  const val = el.value;

  el.value = val.slice(0, start) + text + val.slice(end);
  el.selectionStart = el.selectionEnd = start + text.length;
}

function openPicker(): void {
  emojiPicker.classList.remove("hidden");

  if (isMobile()) {
    document.body.classList.add("emoji-open");
  }
}

function closePicker(): void {
  emojiPicker.classList.add("hidden");

  document.body.classList.remove("emoji-open");
}

emojiBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (emojiPicker.classList.contains("hidden")) {
    openPicker();
  } else {
    closePicker();
  }
});

closeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  closePicker();
});

emojiPicker.addEventListener("click", (e) => e.stopPropagation());

document.addEventListener("click", () => {
  if (!emojiPicker.classList.contains("hidden")) {
    closePicker();
  }
});

emojiPicker.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest("button[data-emoji]");

  if (!target) {
    return;
  }

  const emoji = target.getAttribute("data-emoji");

  if (!emoji) {
    return;
  }

  insertAtCursor(messageInput, emoji);

  // Trigger typing logic (handleTyping listens to the native input event)
  messageInput.dispatchEvent(new Event("input", { bubbles: true }));

  if (!isMobile()) {
    messageInput.focus({ preventScroll: true });
  }
});

emojiPicker.addEventListener("keydown", (e) => {
  const target = e.target as HTMLElement;

  if (
    target.matches("button[data-emoji]") &&
    (e.key === "Enter" || e.key === " ")
  ) {
    e.preventDefault();

    (target as HTMLButtonElement).click();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !emojiPicker.classList.contains("hidden")) {
    closePicker();
  }
});
