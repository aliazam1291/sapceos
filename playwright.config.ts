import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests (2026-10-24), against a PRODUCTION server — dev numbers
 * and dev markup are not what a crawler or a reader gets:
 *
 *   $env:BUILD_DIR=".next-prod"; npx next build; npx next start -p 3210
 *   npm run test:e2e
 *
 * The tools/*-uat.mjs harnesses stay the instruments for measuring (shots,
 * timings, traces); these are the pass/fail gate for a release.
 */
const swiftshader = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // Every page carries several WebGL scenes; SwiftShader is slow and a
  // wide fan-out only measures contention.
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE ?? "http://localhost:3210",
    launchOptions: { args: swiftshader },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    // Chromium with a phone's viewport, touch and user agent.
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /crawl\.spec/ },
  ],
});
