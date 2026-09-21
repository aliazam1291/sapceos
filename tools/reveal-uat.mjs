// After the launch screen lifts, how long until the galaxy is actually on
// screen? First visit, real Chrome (CHROME=1). Waits for html[data-booting]
// to clear, then screenshots the hero every 300 ms for 8 s and reports each
// frame's JPEG size — a black frame compresses to a few KB, a star field to
// tens, the galaxy to more — plus the galaxy's own state flags.
//
//   CHROME=1 node tools/reveal-uat.mjs                 (BASE=https://aliazamkazmi.vercel.app)
//   CHROME=1 BASE=http://localhost:3210 node tools/reveal-uat.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'https://aliazamkazmi.vercel.app';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => {
  window.__t = {};
  for (const ev of ['space:stars', 'space:pad', 'space:ready', 'space:warp']) window.addEventListener(ev, () => (window.__t[ev] = Math.round(performance.now())));
});
const t0 = Date.now();
await p.goto(BASE + '/', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => document.documentElement.hasAttribute('data-booting'), null, { timeout: 30000 }).catch(() => console.log('(no launch screen — booted flag set?)'));
await p.waitForFunction(() => !document.documentElement.hasAttribute('data-booting'), null, { timeout: 60000 });
const lift = Date.now() - t0;
console.log(`launch screen lifted at +${lift}ms after navigation start`);
console.log('events:', JSON.stringify(await p.evaluate(() => window.__t)));
const rect = { x: 0, y: 0, width: 1440, height: 760 };
for (let i = 0; i < 27; i++) {
  const buf = await p.screenshot({ type: 'jpeg', quality: 60, clip: rect });
  const state = await p.evaluate(() => {
    const c = document.querySelector('canvas[data-engine]');
    const cf = window.__cameraFocus;
    return { canvas: !!c, w: c?.width ?? 0, tick: cf?.tick ?? null, opacity: c ? getComputedStyle(c).opacity : null, boot: document.querySelector('[class*="BootScreen"]') ? 'mounted' : 'gone' };
  });
  console.log(`  +${String(i * 300).padStart(4)}ms  hero jpeg ${String(Math.round(buf.length / 1024)).padStart(3)} KB  galaxy tick ${state.tick}  opacity ${state.opacity}  boot ${state.boot}`);
  if (i % 9 === 0) await p.screenshot({ path: `tools/shots/reveal-${i * 300}.png`, clip: rect });
  await p.waitForTimeout(300);
}
await b.close();
