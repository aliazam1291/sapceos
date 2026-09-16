/*
 * Frame-rate probe for the home hero: samples rAF intervals for a few
 * seconds idle, then while scrolling through the flight, and reports the
 * average fps and the share of frames over 20ms (a dropped frame at 60Hz).
 * Headless Chromium uses SwiftShader (software GL), so absolute numbers are
 * pessimistic — compare runs against each other, not against 60.
 *
 *   node tools/fps-uat.mjs      (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// The launch sequence shows once per session; harnesses skip it.
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(5000);

const sample = (ms) =>
  p.evaluate(
    (ms) =>
      new Promise((res) => {
        const d = [];
        let last = performance.now();
        const end = last + ms;
        const tick = (now) => {
          d.push(now - last);
          last = now;
          if (now < end) requestAnimationFrame(tick);
          else {
            const avg = d.reduce((a, b) => a + b, 0) / d.length;
            const long = d.filter((x) => x > 20).length;
            res({ fps: Math.round(1000 / avg), frames: d.length, longShare: Math.round((long / d.length) * 100) });
          }
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );

const idle = await sample(3000);
const scrollP = (async () => {
  for (let i = 0; i < 40; i++) {
    await p.mouse.wheel(0, 60);
    await p.waitForTimeout(60);
  }
})();
const scrolling = await sample(3000);
await scrollP;
console.log(JSON.stringify({ idle, scrolling }));
await b.close();
