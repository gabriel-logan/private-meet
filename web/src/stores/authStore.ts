import { create } from "zustand";

interface AuthStore {
  accessToken: string | null;

  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,

  setAccessToken: (token) =>
    set(() => ({
      accessToken: token,
    })),
}));
