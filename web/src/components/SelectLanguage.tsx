import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiChevronDown, FiGlobe } from "react-icons/fi";
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

interface SelectLanguageProps {
  className: string;
}

export default function SelectLanguage({
  className,
}: Readonly<SelectLanguageProps>) {
  const { i18n } = useTranslation();

  const { locale, setLocale } = useUserStore();

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const languages: {
    value: Locale;
    label: string;
    pct: number;
  }[] = [
    { value: "en", label: "English", pct: 100 },
    { value: "de", label: "Deutsch", pct: lngCoveragePct(deFlat) },
    { value: "ja", label: "日本語", pct: lngCoveragePct(jaFlat) },
    { value: "pt", label: "Português", pct: lngCoveragePct(ptFlat) },
    { value: "zh", label: "中文", pct: lngCoveragePct(zhFlat) },
  ];

  const current = languages.find((l) => l.value === locale)!;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 transition hover:border-zinc-600 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
      >
        <FiGlobe className="text-zinc-400" />
        <span className="font-medium">{current.value.toUpperCase()}</span>
        <span className="inline text-zinc-400">{current.label}</span>
        <FiChevronDown
          className={`ml-1 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 shadow-xl"
          >
            {languages.map((lng) => {
              const active = lng.value === locale;

              return (
                <li key={lng.value}>
                  <button
                    onClick={() => {
                      i18n.changeLanguage(lng.value);

                      setLocale(lng.value);

                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition ${
                      active
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-zinc-300 hover:bg-zinc-900"
                    } `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {lng.value.toUpperCase()}
                      </span>
                      <span className="text-zinc-400">{lng.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{lng.pct}%</span>
                      {active && <FiCheck />}
                    </div>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
