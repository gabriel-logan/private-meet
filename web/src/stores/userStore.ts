import { create } from "zustand";
import { persist } from "zustand/middleware";

import { userStorageKey } from "../constants";
import type { Locale } from "../types";

function safeLocale(locale: Locale): Locale {
  return locale.split("-")[0] as Locale;
}

interface UserStore {
  locale: Locale;
  isLoading: boolean;

  setLocale: (locale: Locale) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      locale: safeLocale(globalThis.navigator.language as Locale) || "en",
      isLoading: false,

      setLocale: (locale) =>
        set(() => ({
          locale,
        })),

      setIsLoading: (isLoading) =>
        set(() => ({
          isLoading,
        })),
    }),
    {
      name: userStorageKey,
    },
  ),
);
