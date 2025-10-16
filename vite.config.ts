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
