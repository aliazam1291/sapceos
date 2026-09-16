// Every part's callout, one tile each, after touchdown.
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
const top = await p.evaluate(() => document.querySelector("#landing").getBoundingClientRect().top + scrollY);
for (let y = 0; y < top - 40; y += 200) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(30); }
await p.evaluate((y) => window.scrollTo(0, y), top - 40);
await p.waitForFunction(() => document.querySelector("#landing")?.hasAttribute("data-landed"), null, { timeout: 20000 });
await p.waitForTimeout(800);
const tiles = [];
const n = await p.locator("#landing button[aria-pressed]").count();
for (let i = 0; i < n; i++) {
  await p.locator("#landing button[aria-pressed]").nth(i).dispatchEvent("click");
  await p.waitForTimeout(900);
  tiles.push(await p.locator("#landing").screenshot());
}
const W = 720, H = 450;
const rs = await Promise.all(tiles.map((t) => sharp(t).resize(W, H, { fit: "inside" }).toBuffer()));
const cols = 3, rows = Math.ceil(rs.length / cols);
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: "#000" } })
  .composite(rs.map((input, i) => ({ input, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).png().toFile("tools/shots/parts.png");
console.log("parts", n, "errors", errs.length, errs.slice(0, 3));
await b.close();
