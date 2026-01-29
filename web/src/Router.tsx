import { BrowserRouter, Route, Routes } from "react-router";

import Footer from "./components/Footer";
import Header from "./components/Header";
import AboutPage from "./pages/About";
import ChatPage from "./pages/Chat";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

export default function Router() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
