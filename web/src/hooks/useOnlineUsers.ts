import { useEffect, useRef, useState } from "react";

import debugHandle from "../actions/debugHandle";

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
    debugHandle("useOnlineUsers exec useEffect: ", { onlineUsers });

    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  return { onlineUsers, setOnlineUsers, onlineUsersRef };
}
