interface ChatInputBehaviorOptions {
  messageTextArea: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
}

export default function initChatInputBehavior({
  messageTextArea,
  sendButton,
}: ChatInputBehaviorOptions): void {
  const isMobile = (): boolean => {
    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    const uaMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|BlackBerry/i.test(
      navigator.userAgent,
    );
    return coarse || uaMobile;
  };

  // Auto-resize textarea up to a max height
  const maxHeight = 160; // px (~10 lines depending on font)
  const autoResize = (): void => {
    messageTextArea.style.height = "auto";
    const newHeight = Math.min(messageTextArea.scrollHeight, maxHeight);
    messageTextArea.style.height = `${newHeight}px`;
    messageTextArea.style.overflowY =
      messageTextArea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  messageTextArea.addEventListener("input", autoResize);
  // Resize at mount (in case there is an initial value)
  queueMicrotask(autoResize);

  messageTextArea.addEventListener("keydown", (e: KeyboardEvent) => {
    // Do not send while composing via IME (e.g., Asian keyboards)
    if (e.isComposing) {
      return;
    }

    const onDesktop = !isMobile();

    if (onDesktop) {
      // Desktop: Enter sends, Shift+Enter inserts a newline
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
          sendButton.click();
        }
      }
    } else {
      // Mobile: Enter always inserts a newline (no interception)
    }
  });
}
