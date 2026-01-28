import { useLocation } from "react-router";

export default function Footer() {
  const isChatPage = useLocation().pathname === "/chat";

  if (isChatPage) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-4 text-center">
        <h1 className="text-sm text-zinc-500">
          Private Meet © {new Date().getFullYear()}
        </h1>
      </div>
    </footer>
  );
}
