import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";

import { useUserStore } from "../stores/userStore";
import en from "../utils/locales/en.json";
import pt from "../utils/locales/pt.json";

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

const enFlat = flattenStrings(en as AnyRecord);
const ptFlat = flattenStrings(pt as AnyRecord);

const totalEnKeys = Object.keys(enFlat).length;

const ptCoveragePct = (() => {
  if (totalEnKeys === 0) {
    return 100;
  }

  let covered = 0;

  for (const key of Object.keys(enFlat)) {
    const v = ptFlat[key];

    if (typeof v === "string" && v.trim().length > 0) {
      covered++;
    }
  }

  return Math.round((covered / totalEnKeys) * 100);
})();

export default function Header() {
  const { t, i18n } = useTranslation();

  const { locale, setLocale } = useUserStore();

  const isChatPage = useLocation().pathname === "/chat";

  if (isChatPage) {
    return null;
  }

  const navLinks = [
    { name: t("Header.Home"), href: "/" },
    { name: t("Header.About"), href: "/about" },
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
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              🌐
            </span>
            <select
              value={locale}
              onChange={(e) => {
                const newLocale = e.target.value as "en" | "pt";

                i18n.changeLanguage(newLocale);
                setLocale(newLocale);
              }}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 transition outline-none focus:ring-1 focus:ring-indigo-500/50"
              aria-label={t("Header.ChangeLanguage")}
            >
              <option value="en">English (100%)</option>
              <option value="pt">Português ({ptCoveragePct}%)</option>
            </select>
          </div>
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
