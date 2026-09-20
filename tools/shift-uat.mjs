/*
 * Layout shift under the reader: section tops at load vs after a full
 * scroll. content-visibility placeholders that guess wrong move the page
 * while it is being read (found 2026-09-18: ~840px on the home page).
 *
 *   node tools/shift-uat.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
for (const route of ["/", "/decisions", "/missions", "/field-notes", "/about"]) {
  await p.goto(BASE + route, { waitUntil: "load" });
  await p.waitForTimeout(3000);
  // Layout positions only (offsetTop chains), not bounding rects: the fly-in
  // transforms rotate boxes and would read as drift.
  const tops = () => p.evaluate(() => [...document.querySelectorAll("[data-section], footer")].map((el) => { let y = 0, e = el; while (e) { y += e.offsetTop; e = e.offsetParent; } return y; }).concat([document.documentElement.scrollHeight]));
  const before = await tops();
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(60); }
  await p.waitForTimeout(600);
  const after = await tops();
  // Signed: a page that GROWS as rows render does so below the viewport
  // (invisible); one that SHRINKS pulls content up under the reader.
  const deltas = before.map((v, i) => (after[i] ?? v) - v);
  const grow = Math.max(0, ...deltas);
  const shrink = Math.max(0, ...deltas.map((d) => -d));
  console.log(`${route.padEnd(14)} grows ${grow}px  shrinks ${shrink}px ${shrink > 24 ? "  ← SHIFT (pulls content up)" : ""}`);
}
await b.close();
