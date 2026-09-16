import { chromium } from "playwright";
import sharp from "sharp";
const b = await chromium.launch();
const errs = [];
// 1. Boot screen: idle, mid-hold, leaving.
let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => errs.push("boot " + e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("boot " + m.text().slice(0, 160)); });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(4500);
const tiles = [await p.screenshot()];
const btn = p.locator('button[aria-label="Hold to launch"]');
await btn.waitFor({ state: "visible", timeout: 10000 });
await p.waitForFunction(() => document.querySelector('button[aria-label="Hold to launch"]')?.hasAttribute("data-ready"), null, { timeout: 15000 });
const box = await btn.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down();
await p.waitForTimeout(250);
tiles.push(await p.screenshot());
await p.waitForTimeout(350);
tiles.push(await p.screenshot()); // deep in the hold
await p.mouse.up();
await p.close();
// 2. The landing at the end of the page.
p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
p.on("pageerror", (e) => errs.push("home " + e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("home " + m.text().slice(0, 160)); });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(2500);
const top = await p.evaluate(() => document.querySelector("#landing").getBoundingClientRect().top + scrollY);
for (let y = 0; y < top - 40; y += 200) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(30); }
await p.evaluate((y) => window.scrollTo(0, y), top - 40);
await p.waitForTimeout(1400);
tiles.push(await p.screenshot()); // descending
await p.waitForTimeout(4000);
tiles.push(await p.screenshot()); // landed, first part
await p.waitForTimeout(4800);
tiles.push(await p.screenshot()); // next part
const landed = await p.evaluate(() => document.querySelector("#landing")?.hasAttribute("data-landed"));
console.log("landed", landed, "errors", errs.length, errs.slice(0, 4));
const W = 720, H = 450;
const rs = await Promise.all(tiles.map((t) => sharp(t).resize(W, H).toBuffer()));
await sharp({ create: { width: W * 3, height: H * 2, channels: 3, background: "#000" } })
  .composite(rs.map((input, i) => ({ input, left: (i % 3) * W, top: Math.floor(i / 3) * H }))).png().toFile("tools/shots/landing.png");
await b.close();
