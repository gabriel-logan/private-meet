import { useEffect, useRef } from "react";

import Loading from "./components/Loading";
import { initWSInstance } from "./lib/wsInstance";
import Router from "./Router";

function App() {
  const wsInstanceExist = useRef(false);

  useEffect(() => {
    async function setupWebSocket() {
      await initWSInstance("awdawd");

      if (wsInstanceExist.current) {
        return;
      }

      wsInstanceExist.current = true;
    }

    setupWebSocket();
  }, []);

  if (!wsInstanceExist) {
    return <Loading />;
  }

  return <Router />;
}

export default App;
