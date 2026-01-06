import { defineConfig } from "vite";

export default defineConfig({
  base: "/mcq/",
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
