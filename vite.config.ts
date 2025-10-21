import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
const rootDir = path.resolve(__dirname, "src/renderer");
const outDir = path.resolve(__dirname, "dist/renderer");

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  base: "./",
  build: {
    outDir,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/metadata': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/library': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/torrents': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/events': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy for SSE
      },
    },
  },
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    root: __dirname,
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
