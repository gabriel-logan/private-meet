import { useEffect, useRef, useState } from "react";

type ChatMessage =
  | {
      id: string;
      author: string;
      timestamp: string;
      isMe: boolean;
      kind: "text";
      text: string;
    }
  | {
      id: string;
      author: string;
      timestamp: string;
      isMe: boolean;
      kind: "image";
      url: string;
      name: string;
      mime: string;
    };

export default function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");

  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return { listEndRef, messages, setMessages, message, setMessage };
}
