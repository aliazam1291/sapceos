import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(3000);
const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
let y = 0, i = 0;
while (y < H) {
  y = Math.min(H, y + 120);
  await p.evaluate((y) => window.scrollTo(0, y), y);
  await p.waitForTimeout(60);
  if (++i % 14 === 0) await p.screenshot({ path: `tools/shots/seq-${String(i / 14).padStart(2, "0")}.png` });
}
console.log("frames", Math.floor(i / 14), "H", H);
await b.close();
