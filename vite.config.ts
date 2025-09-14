import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src", "client", "main.ts"),
        chat: resolve(__dirname, "src", "client", "chat.ts"),
      },
      output: {
        format: "cjs",
        name: "App",
        dir: resolve(__dirname, "public"),
        entryFileNames: (chunk) => {
          return chunk.name === "main" ? "main-bundle.js" : "chat-bundle.js";
        },
        inlineDynamicImports: false,
      },
    },
  },
});
