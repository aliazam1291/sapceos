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
const sel = '[data-section="03 / Results field"]';
const top = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
const h = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, sel);
const tiles = [];
// Warm the lazy chunk (dev compiles it on first request) before sampling.
await p.evaluate((v) => window.scrollTo(0, v), top - 400);
await p.waitForSelector(sel + " canvas", { timeout: 120000 });
await p.waitForTimeout(1500);
for (const f of [0.25, 0.55, 0.85]) {
  const y = top - 900 + f * (900 + h);
  for (let yy = Math.max(0, y - 1200); yy < y; yy += 200) { await p.evaluate((v) => window.scrollTo(0, v), yy); await p.waitForTimeout(30); }
  await p.evaluate((v) => window.scrollTo(0, v), y);
  await p.waitForTimeout(2500);
  tiles.push(await p.screenshot());
}
// Hold to dive: centre the section first.
await p.evaluate((v) => window.scrollTo(0, v), top - (900 - h) / 2);
await p.waitForTimeout(1200);
const r = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left + b.width * 0.62, y: b.top + b.height * 0.5 }; }, sel);
await p.mouse.move(r.x, r.y);
await p.mouse.down();
await p.waitForTimeout(2600);
tiles.push(await p.screenshot());
await p.mouse.up();
// Drag to orbit.
await p.mouse.move(r.x, r.y); await p.mouse.down();
for (let i = 1; i <= 12; i++) { await p.mouse.move(r.x + i * 25, r.y - i * 8); await p.waitForTimeout(30); }
await p.waitForTimeout(1200);
tiles.push(await p.screenshot());
await p.mouse.up();
// The pad.
const lt = await p.evaluate(() => document.querySelector("#landing").getBoundingClientRect().top + scrollY);
for (let y = top; y < lt - 40; y += 200) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(30); }
await p.evaluate((v) => window.scrollTo(0, v), lt - 40);
await p.waitForFunction(() => document.querySelector("#landing")?.hasAttribute("data-landed"), null, { timeout: 20000 });
await p.waitForTimeout(1800);
tiles.push(await p.locator("#landing").screenshot());
const W = 720, H = 450;
const rs = await Promise.all(tiles.map((t) => sharp(t).resize(W, H, { fit: "inside" }).toBuffer()));
const cols = 3, rows = Math.ceil(rs.length / cols);
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: "#000" } })
  .composite(rs.map((input, i) => ({ input, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).png().toFile("tools/shots/hole.png");
console.log("errors", errs.length, errs.slice(0, 4));
await b.close();
