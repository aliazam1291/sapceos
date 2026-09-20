/*
 * A reader's walk: every route, viewport-sized frames every 80% of a
 * screen down the page (settled 900ms each), stitched into one contact
 * sheet per route. For looking, not asserting.
 *
 *   node tools/walk-uat.mjs [/route,...]   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const routes = (process.argv[2] ?? "/missions,/missions/vahan-shakti,/lab,/field-notes,/field-notes/flipkart-product-discovery,/decisions,/about,/mission-history,/contact").split(",");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });

for (const route of routes) {
  await p.goto(BASE + route, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const frames = [];
  for (let y = 0, i = 0; y <= H && i < 12; y += 720, i++) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(900);
    const f = `tools/shots/walk-${route.replace(/\//g, "_") || "home"}-${i}.png`;
    await p.screenshot({ path: f });
    frames.push(f);
  }
  const W = 480, Hh = 300, COLS = 4;
  const tiles = await Promise.all(frames.map((f) => sharp(f).resize(W, Hh).toBuffer()));
  const rows = Math.ceil(tiles.length / COLS);
  const out = `tools/shots/walk${route.replace(/\//g, "_") || "-home"}.png`;
  await sharp({ create: { width: W * COLS, height: Hh * rows, channels: 3, background: "#000" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * W, top: Math.floor(i / COLS) * Hh })))
    .png().toFile(out);
  console.log(route, frames.length, "frames →", out);
}
await b.close();
