import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";

import Footer from "./components/Footer";
import Header from "./components/Header";
import useWsToastError from "./hooks/useWsToastError";
import AboutPage from "./pages/About";
import ChatPage from "./pages/Chat";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";
import { useAuthStore } from "./stores/authStore";

function PrivateLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function Router() {
  useWsToastError();

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<PrivateLayout />}>
          <Route path="/chat" element={<ChatPage />} />
        </Route>
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
