import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src", "client", "main.ts"),
      output: {
        format: "iife",
        name: "App",
        dir: resolve(__dirname, "public"),
        entryFileNames: "bundle.js",
      },
    },
  },
});
