import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { initE2EE } from "../lib/e2ee";
import { useSecretStore } from "../stores/secretStore";

interface UseInitE2eeProps {
  rawRoomId: string | null;
}

export default function useInitE2ee({ rawRoomId }: UseInitE2eeProps) {
  const e2eeKeyRef = useRef<CryptoKey | null>(null);

  const [e2eeReady, setE2eeReady] = useState(false);

  const passphrase = useSecretStore((state) => state.passphrase);

  useEffect(() => {
    let cancelled = false;

    if (!rawRoomId) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        // Use the passphrase from the store if available; otherwise, fall back to rawRoomId
        const key = await initE2EE(passphrase ?? rawRoomId, rawRoomId);

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
  }, [passphrase, rawRoomId]);

  return { e2eeKeyRef, e2eeReady };
}
