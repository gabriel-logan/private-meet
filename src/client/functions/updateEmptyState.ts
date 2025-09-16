interface UpdateEmptyStateParams {
  messagesList: HTMLUListElement;
}

// ---- Empty state for messages ----
const placeholder = document.createElement("div");
placeholder.id = "no-messages-placeholder";
placeholder.className = "text-center text-gray-400 mt-10";
placeholder.textContent = "No messages yet. Start the conversation!";

export default function updateEmptyState({
  messagesList,
}: UpdateEmptyStateParams): void {
  const hasRealMessages = Array.from(messagesList.children).some(
    (el) => el !== placeholder,
  );

  if (!hasRealMessages) {
    if (!messagesList.contains(placeholder)) {
      messagesList.appendChild(placeholder);
    }

    placeholder.style.display = "block";
  } else if (placeholder.parentElement) {
    placeholder.style.display = "none";
  }
}
