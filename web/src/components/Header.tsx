import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiGlobe, FiHome, FiInfo, FiMenu, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";

import { useUserStore } from "../stores/userStore";
import type { Locale } from "../types";
import { resources } from "../utils/i18n";

type AnyRecord = Record<string, unknown>;

function flattenStrings(obj: AnyRecord, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      out[nextKey] = value;
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenStrings(value as AnyRecord, nextKey));
    }
  }

  return out;
}

const enFlat = flattenStrings(resources.en.translation as AnyRecord);
const deFlat = flattenStrings(resources.de.translation as AnyRecord);
const jaFlat = flattenStrings(resources.ja.translation as AnyRecord);
const ptFlat = flattenStrings(resources.pt.translation as AnyRecord);
const zhFlat = flattenStrings(resources.zh.translation as AnyRecord);

const totalEnKeys = Object.keys(enFlat).length;

const lngCoveragePct = (lngFlat: AnyRecord) => {
  if (totalEnKeys === 0) {
    return 100;
  }

  let covered = 0;

  for (const key of Object.keys(enFlat)) {
    const v = lngFlat[key];

    if (typeof v === "string" && v.trim().length > 0) {
      covered++;
    }
  }

  return Math.round((covered / totalEnKeys) * 100);
};

export default function Header() {
  const { t, i18n } = useTranslation();

  const { locale, setLocale } = useUserStore();

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
          <div className="flex items-center gap-2">
            <FiGlobe className="text-zinc-400" />
            <select
              value={locale}
              onChange={(e) => {
                const newLocale = e.target.value as Locale;

                i18n.changeLanguage(newLocale);

                setLocale(newLocale);
              }}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="en">English (100%)</option>
              <option value="de">Deutsch ({lngCoveragePct(deFlat)}%)</option>
              <option value="ja">日本語 ({lngCoveragePct(jaFlat)}%)</option>
              <option value="pt">Português ({lngCoveragePct(ptFlat)}%)</option>
              <option value="zh">中文 ({lngCoveragePct(zhFlat)}%)</option>
            </select>
          </div>

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
                <FiGlobe className="text-zinc-400" />
                <select
                  value={locale}
                  onChange={(e) => {
                    const newLocale = e.target.value as Locale;

                    i18n.changeLanguage(newLocale);

                    setLocale(newLocale);
                  }}
                  className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm text-zinc-100 outline-none"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="pt">Português</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
