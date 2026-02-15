import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { NavigationContainer } from "@react-navigation/native";

import ErrorPage from "./src/components/Error";
import Loading from "./src/components/Loading";
import useInitWsConn from "./src/hooks/useInitWsConn";
import useRetryConnectServer from "./src/hooks/useRetryConnectServer";
import RootStack from "./src/routes/RootStack";
import { useAuthStore } from "./src/stores/authStore";

function Router() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

export default function App() {
  const { t } = useTranslation();

  const { isConnected } = useRetryConnectServer();

  const accessToken = useAuthStore(state => state.accessToken);

  const { ready, error } = useInitWsConn();

  let content: ReactElement;

  if (accessToken) {
    if (error) {
      content = <ErrorPage message={t("Errors.FailedToConnectToWsServer")} />;
    } else if (ready) {
      content = <Router />;
    } else {
      content = <Loading />;
    }
  } else {
    content = <Router />;
  }

  if (!isConnected) {
    return <Loading message="Connecting to server..." />;
  }

  return content;
}
