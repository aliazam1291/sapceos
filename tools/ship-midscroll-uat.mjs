// Check the companion at ~50% scroll progress on secondary pages (mobile
// width), where PAGE_PLAN_COARSE sweeps to its second waypoint.
import { chromium } from "playwright";
const b = await chromium.launch();
// VW/VH pick the viewport: 375x812 (default, the coarse plan) or 1440x900 (the per-kind desktop plans).
const VW = +(process.env.VW ?? 375), VH = +(process.env.VH ?? 812);
const p = await b.newPage({ viewport: { width: VW, height: VH } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const routes = ["/decisions", "/about", "/contact", "/mission-history", "/lab", "/field-notes"];
for (const route of routes) {
  await p.goto("http://localhost:3000" + route, { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const h = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.evaluate((y) => window.scrollTo(0, y), h * 0.5);
  await p.waitForTimeout(1400);
  const name = route.replace(/\//g, "") || "home";
  await p.screenshot({ path: `tools/shots/mid-${VW}-${name}.png` });
}
await b.close();
console.log("done");
