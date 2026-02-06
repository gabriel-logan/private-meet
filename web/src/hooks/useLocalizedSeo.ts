import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import debugHandle from "../actions/debugHandle";

function setMetaByName(name: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!el) {
    return;
  }

  el.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );

  if (!el) {
    return;
  }

  el.setAttribute("content", content);
}

export default function useLocalizedSeo() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    debugHandle("useLocalizedSeo exec useEffect");

    const resolved = i18n.resolvedLanguage ?? i18n.language ?? "en";

    const lang = resolved.split("-")[0] ?? "en";

    document.documentElement.lang = lang;

    const title = t("SEO.Title");
    const description = t("SEO.Description");
    const ogAndTwitterDescription = t("SEO.OgAndTwitterDescription");

    document.title = title;

    setMetaByName("description", description);

    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", ogAndTwitterDescription);

    setMetaByName("twitter:title", title);
    setMetaByName("twitter:description", ogAndTwitterDescription);

    const noscript = document.querySelector("noscript");

    if (noscript) {
      noscript.textContent = t("SEO.NonScriptMsg");
    }
  }, [i18n.language, i18n.resolvedLanguage, t]);
}
