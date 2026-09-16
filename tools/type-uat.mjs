import { chromium } from "playwright";
import sharp from "sharp";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
const tiles = [];
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(2500);
const top = await p.evaluate(() => document.querySelector('[data-section="Operator"]').getBoundingClientRect().top + scrollY);
for (let y = 0; y < top - 60; y += 200) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(30); }
await p.evaluate((y) => window.scrollTo(0, y), top - 60);
await p.waitForTimeout(4000);
tiles.push(await p.screenshot());
for (const r of ["/missions", "/field-notes", "/about"]) {
  await p.goto("http://localhost:3000" + r, { waitUntil: "load" });
  await p.waitForTimeout(3500);
  tiles.push(await p.screenshot());
}
const W = 720, H = 450;
const rs = await Promise.all(tiles.map((t) => sharp(t).resize(W, H).toBuffer()));
await sharp({ create: { width: W * 2, height: H * 2, channels: 3, background: "#000" } })
  .composite(rs.map((input, i) => ({ input, left: (i % 2) * W, top: Math.floor(i / 2) * H }))).png().toFile("tools/shots/type.png");
console.log("errors", errs.length, errs.slice(0, 3));
await b.close();
