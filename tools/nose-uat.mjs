/*
 * Nose-first check for the galaxy flight. While a beat holds the nose is on
 * the world; on a transit it goes along the direction of travel; it is never
 * pointed at the lens. Shoots the galaxy canvas: mid-approach, held on the
 * last system (the reported bad frame), and held again after scrolling back.
 *
 *   node tools/nose-uat.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(5000);
const canvas = p.locator("canvas[data-engine]").first();
const wheel = async (n, dy) => { for (let i = 0; i < n; i++) { await p.mouse.wheel(0, dy); await p.waitForTimeout(40); } };

await wheel(24, 90);
await p.waitForTimeout(2200);
await wheel(12, 90);
await p.waitForTimeout(350);
await canvas.screenshot({ path: "tools/shots/nose-forward.png" });

// All the way to the last system, then hold long enough for the pacer and
// the camera to settle — the frame the report came from.
await wheel(20, 90);
await p.waitForTimeout(6000);
await p.screenshot({ path: "tools/shots/nose-last-held.png" });

// Back two systems and hold.
await wheel(24, -90);
await p.waitForTimeout(400);
await canvas.screenshot({ path: "tools/shots/nose-back.png" });
await p.waitForTimeout(5000);
await canvas.screenshot({ path: "tools/shots/nose-back-held.png" });

console.log(errors.length ? "page errors: " + errors.join(" | ") : "OK: no page errors");
console.log("wrote tools/shots/nose-{forward,last-held,back,back-held}.png");
await b.close();
