/*
 * Client-side navigation check: load home, scroll through the pinned
 * sections, then follow real links (home -> missions -> home -> contact) and
 * fail on any page error or console error. This is the path that surfaced
 * "Failed to execute 'removeChild'" from GSAP's pin-spacer.
 *
 *   node tools/navcheck-uat.mjs        (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// The launch sequence shows once per session; harnesses skip it.
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });

const errors = [];
p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
p.on("console", (m) => {
  if (m.type() === "error" && !/favicon|500 \(Internal/.test(m.text())) errors.push("console: " + m.text().slice(0, 160));
});

await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(3000);

// Scroll through the pinned sections so the pin-spacers exist.
for (let y = 0; y < 9000; y += 600) {
  await p.mouse.wheel(0, 600);
  await p.waitForTimeout(80);
}
await p.waitForTimeout(800);
const pins = await p.evaluate(() => document.querySelectorAll(".pin-spacer").length);

// Real client-side navigations via the dock / links.
const go = async (selector, expectPath) => {
  await p.click(selector);
  await p.waitForURL((u) => u.pathname === expectPath, { timeout: 15000 });
  await p.waitForTimeout(1500);
};
await go('a[href="/missions"]', "/missions");
await go('a[href="/"]', "/");
await p.waitForTimeout(1500);
await go('a[href="/contact"]', "/contact");
await go('a[href="/"]', "/");

console.log(`pin-spacers on home: ${pins}`);
if (errors.length) {
  console.log("ERRORS:\n - " + errors.join("\n - "));
  process.exitCode = 1;
} else {
  console.log("OK: home -> missions -> home -> contact -> home with no page or console errors");
}
await b.close();
