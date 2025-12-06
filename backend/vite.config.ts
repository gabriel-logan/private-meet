import { resolve } from "path";
import { defineConfig } from "vite";

const ENTRY = process.env.ENTRY;

export default defineConfig({
  resolve: {
    alias: {
      src: resolve(__dirname, "src"),
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src", "client", `${ENTRY}.ts`),
      output: {
        format: "iife",
        name: "App",
        dir: resolve(__dirname, "public"),
        inlineDynamicImports: true,
        entryFileNames: `${ENTRY}-bundle.js`,
      },
    },
  },
});
