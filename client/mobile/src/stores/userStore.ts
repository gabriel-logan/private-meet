import { getLocales } from "react-native-localize";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Locale } from "../../../shared/types";
import { resources, userStorageKey } from "../constants";

function safeLocale(locale: string): Locale {
  let language = locale.split("-")[0];

  if (!Object.keys(resources).includes(language)) {
    // eslint-disable-next-line no-console
    console.warn(`Unsupported language "${language}", falling back to "en".`);
    language = "en";
  }

  return language as Locale;
}

interface UserStore {
  locale: Locale;
  isLoading: boolean;

  setLocale: (locale: Locale) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      locale: safeLocale(getLocales()[0].languageCode),
      isLoading: false,

      setLocale: locale =>
        set(() => ({
          locale,
        })),

      setIsLoading: isLoading =>
        set(() => ({
          isLoading,
        })),
    }),
    {
      name: userStorageKey,
    },
  ),
);
