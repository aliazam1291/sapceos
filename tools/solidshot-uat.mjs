/*
 * Close-up of the galaxy's solids: a 2x device-scale shot cropped to the
 * centre of the hero, so the hull shading can actually be judged.
 *
 *   node tools/solidshot-uat.mjs [out.png]   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const out = process.argv[2] ?? "tools/shots/solids.png";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
// The launch sequence shows once per session; harnesses skip it.
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(5000);
await p.screenshot({ path: out, clip: { x: 420, y: 200, width: 600, height: 480 } });
console.log("wrote", out);
await b.close();
