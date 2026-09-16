import { chromium } from "playwright";
import sharp from "sharp";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(2500);
const targets = [["03 / Results field", -80], ["Operator", -120], ["Field notes", -60]];
const tiles = [];
let y = 0;
for (const [name, off] of targets) {
  const top = await p.evaluate((n) => document.querySelector(`[data-section="${n}"]`).getBoundingClientRect().top + scrollY, name);
  for (; y < top + off; y += 160) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(40); }
  await p.evaluate((y) => window.scrollTo(0, y), top + off);
  await p.waitForTimeout(4500);
  tiles.push(await p.screenshot());
}
const W = 800, H = 500;
const rs = await Promise.all(tiles.map((t) => sharp(t).resize(W, H).toBuffer()));
await sharp({ create: { width: W * 3, height: H, channels: 3, background: "#000" } })
  .composite(rs.map((input, i) => ({ input, left: i * W, top: 0 }))).png().toFile("tools/shots/beats.png");
console.log("errors", errs.length, errs.slice(0, 3));
await b.close();
