import { useEffect, useState } from "react";

import ErrorPage from "./components/Error";
import Loading from "./components/Loading";
import { closeWSInstance, updateWSInstanceToken } from "./lib/wsInstance";
import Router from "./Router";
import { useAuthStore } from "./stores/authStore";

function App() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
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

  if (!accessToken) {
    return <Router />;
  }

  if (error) {
    return <ErrorPage message="Failed to connect to WebSocket." />;
  }

  if (!ready) {
    return <Loading />;
  }

  return <Router />;
}

export default App;
