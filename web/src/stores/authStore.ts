import { create } from "zustand";

interface AuthStore {
  accessToken?: string;

  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: undefined,

  setAccessToken: (token) =>
    set(() => ({
      accessToken: token,
    })),
}));
