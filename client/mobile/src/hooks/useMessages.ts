import { useRef, useState } from "react";
import type { FlatList } from "react-native";

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

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  return { flatListRef, messages, setMessages, message, setMessage };
}
