import { chromium } from "playwright";
import sharp from "sharp";
const b = await chromium.launch();
const errs = [];
const tiles = [];
// 1. Launch screen, idle and mid-hold.
let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => errs.push("boot " + e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("boot " + m.text().slice(0, 160)); });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForSelector('[role="dialog"] canvas', { timeout: 60000 });
await p.waitForTimeout(3500);
tiles.push(await p.screenshot());
const btn = p.locator('button[aria-label="Hold to launch"]');
await p.waitForFunction(() => document.querySelector('button[aria-label="Hold to launch"]')?.hasAttribute("data-ready"), null, { timeout: 15000 });
const box = await btn.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down();
await p.waitForTimeout(500);
tiles.push(await p.screenshot());
await p.mouse.up();
await p.close();
// 2. The seam between the flight and the hangar; a measured and a pending report.
p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
p.on("pageerror", (e) => errs.push("home " + e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("home " + m.text().slice(0, 160)); });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(2500);
const hang = await p.evaluate(() => document.querySelector('[data-section="Hangar"]').getBoundingClientRect().top + scrollY);
for (let y = 0; y < hang - 380; y += 200) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(30); }
await p.evaluate((v) => window.scrollTo(0, v), hang - 380);
await p.waitForTimeout(2500);
tiles.push(await p.screenshot());
for (const slug of ["vahan-shakti", "technician-app"]) {
  await p.goto("http://localhost:3000/missions/" + slug, { waitUntil: "load" });
  await p.waitForTimeout(2000);
  const y = await p.evaluate(() => document.querySelector('[aria-label="Results"]').getBoundingClientRect().top + scrollY - 200);
  await p.evaluate((v) => window.scrollTo(0, v), y);
  await p.waitForTimeout(1500);
  tiles.push(await p.screenshot());
}
const W = 720, H = 450;
const rs = await Promise.all(tiles.map((t) => sharp(t).resize(W, H, { fit: "inside" }).toBuffer()));
const cols = 3, rows = Math.ceil(rs.length / cols);
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: "#000" } })
  .composite(rs.map((input, i) => ({ input, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).png().toFile("tools/shots/turn.png");
console.log("errors", errs.length, errs.slice(0, 4));
await b.close();
