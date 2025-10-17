// File: vite.config.ts
// PRF-COMPLIANT CONFIGURATION — ChatCast Studio (2025-10-15)
// Adds explicit alias support for src/services, src/components, and root-level '@'.
// Keeps the secure proxy and sourcemap configuration intact.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // --- Server setup for local API proxying ---
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/voices": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // --- Alias resolution ensures imports like 'services/...' work anywhere in src/ ---
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      services: path.resolve(__dirname, "./src/services"),
      components: path.resolve(__dirname, "./src/components"),
      utils: path.resolve(__dirname, "./src/utils"),
      types: path.resolve(__dirname, "./src/types"),
    },
  },

  // --- Production build settings ---
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      // Avoid accidental externalization of local modules
      external: [],
    },
  },
});
