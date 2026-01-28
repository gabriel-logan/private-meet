import { Link } from "react-router";
import { motion } from "motion/react";

export default function Header() {
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"
      >
        <h1 className="text-lg font-semibold text-zinc-100">
          My Application Header
        </h1>

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
