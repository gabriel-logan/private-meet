import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: "../",

  plugins: [react(), tailwindcss()],

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
          ui: ["react-icons", "emoji-picker-react", "motion", "react-toastify"],
        },
      },
    },
  },
});
