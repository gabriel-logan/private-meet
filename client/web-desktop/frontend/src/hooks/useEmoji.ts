import { useEffect, useRef, useState } from "react";

import { debugHandle } from "../../../../shared/utils/general";

export default function useEmoji() {
  const [emojiOpen, setEmojiOpen] = useState(false);

  const emojiMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close emoji menu when clicking outside
  useEffect(() => {
    debugHandle("useEmoji exec useEffect: ", { emojiOpen });

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
