import { create } from "zustand";

interface AuthStore {
  accessToken?: string;

  setAccessToken: (token: string) => void;
  revokeAccessToken: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: undefined,

  setAccessToken: (token) =>
    set(() => ({
      accessToken: token,
    })),

  revokeAccessToken: () =>
    set(() => ({
      accessToken: undefined,
    })),
}));
