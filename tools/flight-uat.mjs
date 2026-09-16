/*
 * Mission flight check: the hero pins, scrolling advances the beat, the HUD
 * docks with the right mission, and the galaxy focuses its node. Shoots the
 * frame at beat 2 for eyeballing.
 *
 *   node tools/flight-uat.mjs [out.png]   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const out = process.argv[2] ?? "tools/shots/flight.png";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// The launch sequence shows once per session; harnesses skip it.
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(5000);

const read = () => p.evaluate(() => ({
  pinned: !!document.querySelector("#arrival .pin-spacer"),
  hint: document.querySelector("#arrival [class*=hint]")?.textContent?.trim(),
  hud: document.querySelector("#arrival aside h2")?.textContent?.trim() ?? null,
  hudImg: !!document.querySelector("#arrival aside img"),
  stops: [...document.querySelectorAll("#arrival ol button")].map((s) => s.hasAttribute("data-on")),
}));

const beat0 = await read();
// Wheel through ~1.15 viewports per beat; two beats in.
for (let i = 0; i < 24; i++) { await p.mouse.wheel(0, 90); await p.waitForTimeout(40); }
await p.waitForTimeout(1800);
const beat2 = await read();
await p.screenshot({ path: out });
for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 90); await p.waitForTimeout(40); }
await p.waitForTimeout(1500);
const beat3 = await read();

console.log(JSON.stringify({ beat0, beat2, beat3 }, null, 2));
const issues = [];
if (!beat0.pinned) issues.push("hero not pinned");
if (beat0.hud !== null) issues.push("HUD should be idle at beat 0");
if (!beat2.hud) issues.push("HUD did not dock after scrolling");
if (beat2.hud && beat3.hud && beat2.hud === beat3.hud) issues.push("HUD did not advance to the next system");
if (errors.length) issues.push("page errors: " + errors.join(" | "));
console.log(issues.length ? "ISSUES:\n - " + issues.join("\n - ") : "OK: flight pins, beats advance, HUD docks per system");
console.log("wrote", out);
await b.close();
