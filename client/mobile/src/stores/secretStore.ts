import { create } from "zustand";

interface SecretStore {
  passphrase: string | null;

  setPassphrase: (passphrase: string) => void;

  clearPassphrase: () => void;
}

export const useSecretStore = create<SecretStore>(set => ({
  passphrase: null,

  setPassphrase: passphrase =>
    set({
      passphrase,
    }),

  clearPassphrase: () =>
    set({
      passphrase: null,
    }),
}));
