import { useEffect, useRef, useState } from "react";

export type OnlineUser = {
  id: string;
  name: string;
  status: "online" | "idle";
};

export default function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const onlineUsersRef = useRef<OnlineUser[]>([]);

  // Keep online users ref updated
  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  return { onlineUsers, setOnlineUsers, onlineUsersRef };
}
