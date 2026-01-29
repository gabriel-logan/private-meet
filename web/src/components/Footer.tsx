import { FaGithub } from "react-icons/fa";
import { Link, useLocation } from "react-router";

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
        <div>
          <Link
            to="https://github.com/gabriel-logan/private-meet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:underline"
          >
            <FaGithub className="mr-1 mb-0.5 inline" />
            GitHub Repository
          </Link>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          <Link
            to="https://gabriel-logan.github.io/gabriel-logan"
            target="_blank"
            rel="noopener noreferrer"
          >
            Created by Gabriel Logan
          </Link>
        </p>
      </div>
    </footer>
  );
}
