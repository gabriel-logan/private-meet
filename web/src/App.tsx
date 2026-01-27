import { useEffect, useState } from "react";

import ErrorPage from "./components/Error";
import Loading from "./components/Loading";
import { initWSInstance } from "./lib/wsInstance";
import Router from "./Router";

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    initWSInstance("awdawd", 10, 1000)
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <ErrorPage message="Failed to connect to WebSocket." />;
  }

  if (!ready) {
    return <Loading />;
  }

  return <Router />;
}

export default App;
