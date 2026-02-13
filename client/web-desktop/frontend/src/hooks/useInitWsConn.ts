import { useEffect, useState } from "react";

import { debugHandle } from "../../../../shared/utils/general";
import { closeWSInstance, updateWSInstanceToken } from "../lib/wsInstance";
import { useAuthStore } from "../stores/authStore";

export default function useInitWsConn() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    debugHandle("useInitWsConn exec useEffect");

    let cancelled = false;

    if (!accessToken) {
      closeWSInstance();

      queueMicrotask(() => {
        if (cancelled) {
          return;
        }

        setReady(false);
        setError(false);
      });

      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setReady(false);
      setError(false);
    });

    updateWSInstanceToken(accessToken)
      .then(() => {
        if (cancelled) {
          return;
        }

        setReady(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { ready, error };
}
