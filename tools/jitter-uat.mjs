// Frame-to-frame change in the ship's region while the page sits still
// (idle bob only) and while it scrolls. Lower is calmer.
import { chromium } from "playwright";
import sharp from "sharp";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await p.goto("http://localhost:3000/about", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(3000);
async function grab() { return sharp(await p.locator("canvas").nth(0).screenshot()).raw().toBuffer({ resolveWithObject: true }); }
async function diffRun(n, step) {
  let prev = await grab(); let total = 0;
  for (let i = 0; i < n; i++) {
    if (step) await p.evaluate((s) => window.scrollBy(0, s), step);
    await p.waitForTimeout(50);
    const cur = await grab(); let d = 0;
    for (let k = 0; k < cur.data.length; k += 16) d += Math.abs(cur.data[k] - prev.data[k]);
    total += d / (cur.data.length / 16); prev = cur;
  }
  return (total / n).toFixed(2);
}
console.log("idle mean px delta", await diffRun(8, 0));
console.log("scroll mean px delta", await diffRun(8, 90));
await b.close();
