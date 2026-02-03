import { useRef, useState } from "react";

export default function useTypingUsers() {
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);

  const typingLabel = (() => {
    const names = Object.values(typingUsers);

    if (names.length === 0) {
      return "";
    }

    if (names.length === 1) {
      return `${names[0]} is typing…`;
    }

    if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing…`;
    }

    return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing…`;
  })();

  return {
    setTypingUsers,
    typingTimeoutRef,
    typingSentRef,
    typingLabel,
  };
}
