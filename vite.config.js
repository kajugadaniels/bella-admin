import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // --- TEMP FIX for resolvers built against Zod v4 entrypoints
      "zod/v4/core": "zod",
      "zod/v4": "zod",
    },
  },
})
