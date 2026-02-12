import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";

import ErrorPage from "./components/Error";
import Loading from "./components/Loading";
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

  return (
    <>
      <ToastContainer autoClose={3000} />
      {content}
    </>
  );
}
