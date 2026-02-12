import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type UserConfig } from "vite";

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

export default defineConfig(({ mode }): UserConfig => {
  const envDir = "../../../";

  const env = loadEnv(mode, envDir, "");

  const useTLS = env.USE_LOCAL_TLS === "true";

  const roomIdPrefix = env.ROOM_ID_PREFIX;
  const e2eeWirePrefix = env.E2EE_WIRE_PREFIX;
  const webRTCFileChannelLabel = env.WEBRTC_FILE_CHANNEL_LABEL;

  if (!roomIdPrefix || !e2eeWirePrefix || !webRTCFileChannelLabel) {
    throw new Error(
      "Missing required environment variables. Please check your .env file.",
    );
  }

  return {
    envDir: envDir,

    define: {
      __ROOM_ID_PREFIX__: JSON.stringify(roomIdPrefix + ":"),
      __E2EE_WIRE_PREFIX__: JSON.stringify(e2eeWirePrefix + ":"),
      __WEBRTC_FILE_CHANNEL_LABEL__: JSON.stringify(
        webRTCFileChannelLabel + ":",
      ),
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
      https: useTLS
        ? {
            key: envDir + "cert/fake_key.pem",
            cert: envDir + "cert/fake_cert.pem",
          }
        : undefined,

      host: useTLS,
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
  };
});
