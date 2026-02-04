import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiHome, FiInfo, FiMenu, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";

import SelectLanguage from "./SelectLanguage";

export default function Header() {
  const { t } = useTranslation();

  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  if (location.pathname === "/chat") {
    return null;
  }

  const navLinks = [
    {
      name: t("Header.Home"),
      href: "/",
      icon: FiHome,
    },
    {
      name: t("Header.About"),
      href: "/about",
      icon: FiInfo,
    },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Private Meet" className="h-8 w-8" />
          <span className="text-lg font-semibold text-zinc-100">
            Private Meet
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ href, name, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-2 text-sm transition ${
                isActive(href)
                  ? "text-indigo-400"
                  : "text-zinc-400 hover:text-zinc-100"
              } `}
            >
              <Icon className="text-base" />
              {name}
            </Link>
          ))}

          <div className="flex items-center gap-2">
            <SelectLanguage className="rounded-md bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500/50" />
          </div>
        </nav>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-zinc-100 md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </motion.div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map(({ href, name, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    isActive(href)
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-zinc-300 hover:bg-zinc-900"
                  } `}
                >
                  <Icon />
                  {name}
                </Link>
              ))}

              <div className="mt-2 flex items-center gap-2">
                <SelectLanguage className="flex-1 rounded-md bg-zinc-950 px-2 py-2 text-sm text-zinc-100 outline-none" />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
