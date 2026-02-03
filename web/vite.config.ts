import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const genPrefix = (length: number): string => {
  if (length > 32) {
    throw new Error("Prefix length too long");
  }

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let out = "";

  for (let i = 0; i < length; i++) {
    out += chars[Math.trunc(Math.random() * chars.length)];
  }

  return out;
};

export default defineConfig({
  envDir: "../",

  define: {
    __ROOM_ID_PREFIX__: JSON.stringify(genPrefix(5) + ":"),
    __E2EE_WIRE_PREFIX__: JSON.stringify(genPrefix(5) + ":"),
    __WEBRTC_FILE_CHANNEL_LABEL__: JSON.stringify(genPrefix(5) + ":"),
    __USER_STORAGE_KEY__: JSON.stringify(genPrefix(5) + ":"),
  },

  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    tailwindcss(),
  ],

  server: {
    https: {
      key: "../cert/fake_key.pem",
      cert: "../cert/fake_cert.pem",
    },

    host: true,
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router"],
          ui1: ["react-icons", "emoji-picker-react"],
          ui2: ["motion", "react-toastify"],
          i18next: ["i18next", "react-i18next"],
        },
      },
    },
  },
});
