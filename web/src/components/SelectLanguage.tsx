import { useTranslation } from "react-i18next";

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

  return (
    <select
      value={locale}
      onChange={(e) => {
        const newLocale = e.target.value as Locale;

        i18n.changeLanguage(newLocale);

        setLocale(newLocale);
      }}
      className={className}
    >
      <option value="en">EN - English (100%)</option>
      <option value="de">DE - Deutsch ({lngCoveragePct(deFlat)}%)</option>
      <option value="ja">JA - 日本語 ({lngCoveragePct(jaFlat)}%)</option>
      <option value="pt">PT - Português ({lngCoveragePct(ptFlat)}%)</option>
      <option value="zh">ZH - 中文 ({lngCoveragePct(zhFlat)}%)</option>
    </select>
  );
}
