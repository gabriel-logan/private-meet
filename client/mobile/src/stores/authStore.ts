import { create } from "zustand";

interface AuthStore {
  accessToken?: string;

  isLoggedIn: () => boolean;

  setAccessToken: (token: string) => void;
  revokeAccessToken: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: undefined,

  isLoggedIn: () => !!get().accessToken,

  setAccessToken: token =>
    set({
      accessToken: token,
    }),

  revokeAccessToken: () =>
    set({
      accessToken: undefined,
    }),
}));
