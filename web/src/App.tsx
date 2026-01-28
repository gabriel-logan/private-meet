import { useEffect, useState } from "react";

import ErrorPage from "./components/Error";
import Loading from "./components/Loading";
import { initWSInstance } from "./lib/wsInstance";
import Router from "./Router";
import { useAuthStore } from "./stores/authStore";

function App() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    initWSInstance(accessToken, 10, 1000)
      .then(() => setReady(true))
      .catch(() => setError(true));
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
