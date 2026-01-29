import { useEffect } from "react";
import { toast } from "react-toastify";

import { initE2EE } from "../lib/e2ee";

interface UseInitE2eeProps {
  rawRoomId: string | null;
  e2eeKeyRef: React.RefObject<CryptoKey | null>;
  setE2eeReady: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function useInitE2ee({
  rawRoomId,
  e2eeKeyRef,
  setE2eeReady,
}: UseInitE2eeProps) {
  useEffect(() => {
    let cancelled = false;

    if (!rawRoomId) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        // I'm using roomId as secret here for simplicity. In real world use cases, use a proper secret exchange.
        const key = await initE2EE(rawRoomId, rawRoomId);

        if (cancelled) {
          return;
        }

        e2eeKeyRef.current = key;

        setE2eeReady(true);
      } catch (error) {
        console.error("Failed to initialize E2EE:", error);
        if (!cancelled) {
          toast.error("Failed to initialize E2EE.");
          setE2eeReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setE2eeReady(false);
      e2eeKeyRef.current = null;
    };
  }, [e2eeKeyRef, rawRoomId, setE2eeReady]);
}
