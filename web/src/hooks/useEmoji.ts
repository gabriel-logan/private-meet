import { useEffect, useRef, useState } from "react";

export default function useEmoji() {
  const [emojiOpen, setEmojiOpen] = useState(false);

  const emojiMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close emoji menu when clicking outside
  useEffect(() => {
    if (!emojiOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const menuEl = emojiMenuRef.current;
      const buttonEl = emojiButtonRef.current;

      if (menuEl?.contains(target)) {
        return;
      }

      if (buttonEl?.contains(target)) {
        return;
      }

      setEmojiOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [emojiOpen]);

  return { emojiOpen, setEmojiOpen, emojiMenuRef, emojiButtonRef };
}
