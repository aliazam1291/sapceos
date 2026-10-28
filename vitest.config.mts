import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/*
 * Unit tests (2026-10-24): the content layer, the SEO builders, the sitemap
 * and robots, the redirect lookup. Everything here runs without a browser or
 * a server — the browser-level checks are Playwright (playwright.config.ts,
 * tests/e2e) against a production build.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
