import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { parseIncomingWSMessage } from "../../../shared/protocol/ws";
import { debugHandle } from "../../../shared/utils/general";
import { getWSInstance } from "../lib/wsInstance";

export default function useGenerateRoomID() {
  const { t } = useTranslation();

  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    debugHandle("useGenerateRoomID exec useEffect");

    let ws: WebSocket;

    try {
      ws = getWSInstance();
    } catch (error) {
      console.error("WebSocket instance could not be obtained:", error);
      return;
    }

    const onMessage = async (event: any) => {
      try {
        const { type, data } = await parseIncomingWSMessage(event.data);

        if (type === "utils.generateRoomID") {
          setRoomId(data.roomID);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [t]);

  return { roomId, setRoomId };
}
