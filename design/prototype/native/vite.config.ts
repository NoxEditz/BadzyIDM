import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Standalone single-page build of the Badzy UI, hosted by the Rust shell (WebView2).
const here = path.resolve(__dirname);
export default defineConfig({
  root: here,
  base: "./",
  publicDir: path.join(here, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@/assets/badzy-logo.png.asset.json", replacement: path.join(here, "logo.json") },
      { find: "@", replacement: path.resolve(here, "../src") },
    ],
  },
  build: { outDir: path.resolve(here, "dist"), emptyOutDir: true, target: "es2020" },
});
