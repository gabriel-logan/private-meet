import { BrowserRouter, Route, Routes } from "react-router";

import Footer from "./components/Footer";
import Header from "./components/Header";
import ChatPage from "./pages/Chat";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

export default function Router() {
  const isChatPage = globalThis.location.pathname === "/chat";

  return (
    <BrowserRouter>
      {!isChatPage && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {!isChatPage && <Footer />}
    </BrowserRouter>
  );
}
