// File: vite.config.ts
// PRF-COMPLIANT CONFIGURATION — ChatCast Studio (2025-10-20)
// Upgraded to resolve WebSocket "can't connect" issue in Firefox/Chrome.
// Maintains aliases, proxy, and sourcemap support.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  server: {
    host: true, // binds to all network interfaces
    port: 5173,
    strictPort: true, // fail if port is in use
    open: true, // auto-open browser on dev start
    cors: true, // allow CORS for dev server
    // Explicit WebSocket URL config to avoid Firefox/Chrome connection errors
    client: {
      webSocketURL: "ws://localhost:5173/ws", // Vite HMR WebSocket endpoint
    },
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

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      services: path.resolve(__dirname, "./src/services"),
      components: path.resolve(__dirname, "./src/components"),
      utils: path.resolve(__dirname, "./src/utils"),
      types: path.resolve(__dirname, "./src/types"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
  },

  // --- Optional optimization tweaks to improve HMR stability ---
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
});
