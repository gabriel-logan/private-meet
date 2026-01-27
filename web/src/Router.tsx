import { BrowserRouter, Route, Routes } from "react-router";

import Footer from "./components/Footer";
import Header from "./components/Header";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

export default function Router() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
