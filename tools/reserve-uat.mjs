// For every `.flies` / `.objectRow` element on a route: the height CSS
// reserves while it is off-screen (contain-intrinsic-size) against the
// height it actually renders at. A reserve that is too big pulls the page
// up under the reader when the row is reached (tools/shift-uat.mjs finds
// the symptom; this names the row).
//
//   node tools/reserve-uat.mjs /decisions        (BASE=http://localhost:3210)
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(1500);
// Scroll everything into view once so every row has rendered.
const h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 600) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(80);
}
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
const rows = await p.evaluate(() => {
  const out = {};
  for (const el of document.querySelectorAll('.flies, .objectRow')) {
    const cs = getComputedStyle(el);
    const reserve = cs.getPropertyValue('contain-intrinsic-size');
    const rect = el.getBoundingClientRect();
    const key = `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0].slice(0, 30)} reserve=${reserve.trim()}`;
    (out[key] ??= []).push(Math.round(rect.height));
  }
  return out;
});
for (const [k, hs] of Object.entries(rows)) {
  const avg = Math.round(hs.reduce((a, b) => a + b, 0) / hs.length);
  console.log(k.padEnd(78), `rendered ${Math.min(...hs)}–${Math.max(...hs)} (avg ${avg}) × ${hs.length}`);
}
await b.close();
