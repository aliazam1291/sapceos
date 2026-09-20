// Screenshot the top of every secondary page (PAGE_PLAN) at mobile width,
// right after load, to see where the companion ship rests relative to copy.
import { chromium } from "playwright";
const b = await chromium.launch();
// VW/VH pick the viewport: 375x812 (default, the coarse plan) or 1440x900 (the per-kind desktop plans).
const VW = +(process.env.VW ?? 375), VH = +(process.env.VH ?? 812);
const p = await b.newPage({ viewport: { width: VW, height: VH } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const routes = ["/decisions", "/about", "/contact", "/mission-history", "/missions", "/lab", "/field-notes", "/missions/vahan-shakti", "/field-notes/linear-vs-jira"];
for (const route of routes) {
  await p.goto("http://localhost:3000" + route, { waitUntil: "load" });
  await p.waitForTimeout(2200);
  const name = route.replace(/\//g, "") || "home";
  await p.screenshot({ path: `tools/shots/ship-${VW}-${name}.png` });
}
await b.close();
console.log("done");
