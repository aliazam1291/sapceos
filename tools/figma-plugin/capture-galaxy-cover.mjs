// A clean, sharp galaxy frame at the Behance cover's size (1616×1264),
// canvas only (every non-canvas element hidden for the shot), from production.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-size=1700,1400"] });
const ctx = await b.newContext({ viewport: { width: 1616, height: 1264 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); localStorage.setItem("space-os:perf", "high"); } catch {} });
const p = await ctx.newPage();
await p.goto("https://aliazamkazmi.vercel.app/", { waitUntil: "load", timeout: 90000 });
await p.waitForTimeout(6000);
for (const [i, frac] of [[1, 0.35], [2, 0.6], [3, 0.95]].entries ? [[1, 0.35], [2, 0.6], [3, 0.95]] : []) {
  await p.evaluate((f) => { const a = document.getElementById("arrival"); window.scrollTo(0, a.getBoundingClientRect().top + scrollY + innerHeight * f); }, frac);
  await p.waitForTimeout(7000);
  const h = await p.evaluateHandle(() => [...document.getElementById("arrival").querySelectorAll("canvas")].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0]);
  await p.addStyleTag({ content: "* { visibility: hidden !important; } canvas { visibility: visible !important; }" });
  await p.waitForTimeout(400);
  await h.asElement().screenshot({ path: path.join(here, "shots", `galaxy-cover-${i}.png`) });
  await p.evaluate(() => document.querySelectorAll("style").forEach((s) => { if (s.textContent.startsWith("* { visibility: hidden")) s.remove(); }));
  console.log("shot", i);
}
await b.close();
