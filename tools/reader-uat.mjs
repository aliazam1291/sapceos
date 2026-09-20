/*
 * What a reader actually sees. Scrolls the home page at a human pace
 * (wheel ticks, ~1100px/s) and, for each leg, shoots the frame the moment
 * its top reaches the viewport ("arrive") and again after 3s ("settled").
 * The difference between the two is what a reader who keeps scrolling
 * never sees. Also measures, per leg, how much of its text/objects are
 * still at opacity < 0.5 on arrival.
 *
 *   node tools/reader-uat.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(3500);

const legs = await p.evaluate(() =>
  [...document.querySelectorAll("[data-section]")].map((el) => ({ id: el.id, name: el.getAttribute("data-section"), top: el.getBoundingClientRect().top + scrollY })),
);
console.log("legs:", legs.map((l) => `${l.name}@${Math.round(l.top)}`).join("  "));

const hidden = async () =>
  p.evaluate(() => {
    // Visible-region elements that carry text or an object, and are faded.
    const els = [...document.querySelectorAll("main h2, main h3, main p, main li, main article, main figure, main img, main svg")];
    let inView = 0, faded = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue;
      inView++;
      const o = parseFloat(getComputedStyle(el).opacity);
      if (o < 0.5) faded++;
    }
    return { inView, faded };
  });

let y = 0;
const step = 110; // px per wheel tick
const tick = 100; // ms per tick → 1100px/s
for (const leg of legs) {
  if (leg.name === "Arrival") continue; // the pinned flight is its own thing
  while (y < leg.top - 40) {
    y = Math.min(leg.top - 40, y + step);
    await p.mouse.wheel(0, step);
    await p.waitForTimeout(tick);
  }
  await p.waitForTimeout(150);
  const a = await hidden();
  await p.screenshot({ path: `tools/shots/reader-${leg.id}-arrive.png` });
  await p.waitForTimeout(3000);
  const s = await hidden();
  await p.screenshot({ path: `tools/shots/reader-${leg.id}-settled.png` });
  console.log(`${leg.name.padEnd(14)} arrive: ${a.faded}/${a.inView} faded   settled: ${s.faded}/${s.inView} faded`);
}
await b.close();
