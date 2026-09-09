import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001",
    },
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
