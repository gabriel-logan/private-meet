import { type ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";

import { Greet } from "../wailsjs/go/main/App";
import ErrorPage from "./components/Error";
import Loading from "./components/Loading";
import { isDesktop } from "./constants";
import useInitWsConn from "./hooks/useInitWsConn";
import useLocalizedSeo from "./hooks/useLocalizedSeo";
import Router from "./Router";
import { useAuthStore } from "./stores/authStore";
export default function App() {
  const { t } = useTranslation();

  useLocalizedSeo();

  const accessToken = useAuthStore((state) => state.accessToken);

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

  useEffect(() => {
    if (isDesktop) {
      Greet("Private Meet").then((message) => {
        // eslint-disable-next-line no-console
        console.log(message);
      });
    } else {
      // eslint-disable-next-line no-console
      console.log("Welcome to Private Meet!");
    }
  }, []);

  return (
    <>
      <ToastContainer autoClose={3000} />
      {content}
    </>
  );
}
