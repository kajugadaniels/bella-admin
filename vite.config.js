/* eslint-env node */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import process from "node:process"; // <-- add this

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use repo subpath on GitHub Actions (Pages), "/" locally
const base = process.env.GITHUB_ACTIONS ? "/bella-admin/" : "/";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  base,
});
