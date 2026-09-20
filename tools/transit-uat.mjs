/*
 * The galaxy flight model (2026-09-18): boarding, an arced transit with
 * the ship leading, arrival and settle, the climb-out. Shoots a filmstrip
 * of one transit (frames at 0.15s, 0.5s, 0.9s, 1.4s, 2.6s after the beat
 * changes) and the two ends of the flight, so the motion can be read as
 * a sequence rather than a still.
 *
 *   node tools/transit-uat.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(4500);
// A page clip, not an element shot: a live canvas is never "stable".
const box = await p.locator("canvas[data-engine]").first().boundingBox();
const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, 1440), height: Math.min(box.height, 900) };
const shot = (path) => p.screenshot({ path, clip });
const wheel = async (n, dy) => { for (let i = 0; i < n; i++) { await p.mouse.wheel(0, dy); await p.waitForTimeout(40); } };

// Boarding: the ship is at station on the overview.
await shot("tools/shots/transit-00-boarding.png");

// To beat 2 and hold, then trigger the transit to beat 3 and film it.
await wheel(24, 90);
await p.waitForTimeout(3000);
await wheel(12, 90);
const frames = [];
const at = [150, 500, 900, 1400, 2600];
let last = 0;
for (const ms of at) {
  await p.waitForTimeout(ms - last);
  last = ms;
  const f = `tools/shots/transit-${ms}.png`;
  await shot(f);
  frames.push(f);
}
// Stitch the filmstrip.
const W = 720, H = 450;
const tiles = await Promise.all(frames.map((f) => sharp(f).resize(W, H).toBuffer()));
await sharp({ create: { width: W * tiles.length, height: H, channels: 3, background: "#000" } })
  .composite(tiles.map((input, i) => ({ input, left: i * W, top: 0 })))
  .png().toFile("tools/shots/transit-strip.png");

// To the last 3% of the pin (progress > 0.965 raises `leaving`): the
// climb-out, while the galaxy is still on screen.
await p.evaluate(() => { const h = document.getElementById("arrival").getBoundingClientRect().height - innerHeight; window.scrollTo(0, Math.round(h * 0.975)); });
await p.waitForTimeout(350);
await shot("tools/shots/transit-leaving.png");
await p.waitForTimeout(700);
await shot("tools/shots/transit-leaving-2.png");

console.log(errors.length ? "page errors: " + errors.join(" | ") : "OK: no page errors");
console.log("wrote tools/shots/transit-strip.png (+ boarding, leaving)");
await b.close();
