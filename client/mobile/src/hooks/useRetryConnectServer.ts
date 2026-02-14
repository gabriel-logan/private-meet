import { useEffect, useRef, useState } from "react";

import { debugHandle } from "../../../shared/utils/general";
import apiInstance from "../lib/apiInstance";

const RETRY_INTERVAL = 1000 * 30;

export default function useRetryConnectServer() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    debugHandle("useRetryConnectServer: Starting connection check...");

    async function checkConnection() {
      try {
        await apiInstance.get("/health");

        setIsConnected(true);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);

          intervalRef.current = null;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.debug("Failed to connect to server, retrying...", error);

        setIsConnected(false);
      }
    }

    checkConnection();

    intervalRef.current = setInterval(() => {
      checkConnection();
    }, RETRY_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isConnected,
  };
}
