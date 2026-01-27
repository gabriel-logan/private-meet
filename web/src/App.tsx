import { useEffect } from "react";

import { initWSInstance } from "./lib/wsInstance";
import Router from "./Router";

function App() {
  useEffect(() => {
    initWSInstance("awdawd");
  }, []);

  return <Router />;
}

export default App;
