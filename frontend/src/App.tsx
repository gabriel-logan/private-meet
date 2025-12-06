import { BrowserRouter, Route, Routes } from "react-router";

import Header from "./components/Header";
import ChatPage from "./pages/Chat";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:id" element={<ChatPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
