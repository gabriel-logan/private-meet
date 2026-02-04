import { initReactI18next } from "react-i18next";
import i18next from "i18next";

import { useUserStore } from "../stores/userStore";
import de from "./locales/de.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";

export const resources = {
  en: { translation: en },
  de: { translation: de },
  ja: { translation: ja },
  pt: { translation: pt },
  zh: { translation: zh },
} as const;

const language = useUserStore.getState().locale;

if (!Object.keys(resources).includes(language)) {
  console.warn(`Unsupported language "${language}", falling back to "en".`);
}

console.log("i18n language:", language);

i18next.use(initReactI18next).init({
  resources,

  lng: language,

  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },
});
