interface UpdateEmptyStateParams {
  messagesContainer: HTMLDivElement;
}

// ---- Empty state for messages ----
const placeholder = document.createElement("div");
placeholder.id = "no-messages-placeholder";
placeholder.className = "text-center text-gray-400 mt-10";
placeholder.textContent = "No messages yet. Start the conversation!";

export default function updateEmptyState({
  messagesContainer,
}: UpdateEmptyStateParams): void {
  const hasRealMessages = Array.from(messagesContainer.children).some(
    (el) => el !== placeholder,
  );

  if (!hasRealMessages) {
    if (!messagesContainer.contains(placeholder)) {
      messagesContainer.appendChild(placeholder);
    }

    placeholder.style.display = "block";
  } else if (placeholder.parentElement) {
    placeholder.style.display = "none";
  }
}
