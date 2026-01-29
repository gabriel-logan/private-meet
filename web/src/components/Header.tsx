import { Link, useLocation } from "react-router";
import { motion } from "motion/react";

export default function Header() {
  const isChatPage = useLocation().pathname === "/chat";

  if (isChatPage) {
    return null;
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"
      >
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Private Meet"
            className="h-8 w-8"
            loading="eager"
          />
          <h1 className="text-lg font-semibold text-zinc-100">Private Meet</h1>
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-zinc-400 transition hover:text-zinc-100"
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </motion.div>
    </header>
  );
}
