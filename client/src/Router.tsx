import { BrowserRouter, Route, Routes } from "react-router";

import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
