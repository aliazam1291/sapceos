// How does the pinned galaxy flight feel under a wheel? Real Chrome, production.
// Wheel ticks (so Lenis interpolates, as for a reader), rAF frame times, long
// tasks, and — the "does scroll do anything" question — how far the camera's
// subject distance and the stage move per frame while the page is pinned.
// Run with nothing else on the GPU (the desktop pane's own galaxy included).
//   CHROME=1 node tools/flightfeel-uat.mjs
//   CHROME=1 PERF=medium WAIT=12000 node tools/flightfeel-uat.mjs   (force a level)
// 2026-10-24, Intel UHD: high 83 ms p50 → low (now its default) 33 ms, no
// long task over 200 ms; "level now" shows whether the fps probe stepped down.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.addInitScript((lvl) => {
  sessionStorage.setItem('space-os:booted', '1');
  if (lvl) localStorage.setItem('space-os:perf', lvl);
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true });
}, process.env.PERF ?? '');
await p.goto(BASE + '/', { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(+(process.env.WAIT ?? 7000));
console.log('level', await p.evaluate(() => document.documentElement.dataset.perf));
await p.mouse.move(700, 450);
await p.evaluate(() => {
  window.__long = [];
  window.__fr = [];
  let last = performance.now();
  const cf = window.__cameraFocus;
  const tick = (now) => {
    window.__fr.push({ t: Math.round(now), dt: +(now - last).toFixed(1), y: Math.round(scrollY), dist: cf ? +cf.dist.toFixed(3) : 0, on: cf ? +cf.on.toFixed(2) : 0 });
    last = now;
    window.__raf = requestAnimationFrame(tick);
  };
  window.__raf = requestAnimationFrame(tick);
});
const STEP = +(process.env.STEP ?? 100), GAP = +(process.env.GAP ?? 110), N = +(process.env.N ?? 60);
for (let i = 0; i < N; i++) {
  await p.mouse.wheel(0, STEP);
  await p.waitForTimeout(GAP);
}
await p.waitForTimeout(1500);
const { fr, long } = await p.evaluate(() => { cancelAnimationFrame(window.__raf); return { fr: window.__fr, long: window.__long }; });
const d = fr.slice(3).map((f) => f.dt).sort((a, b) => a - b);
const q = (n) => d[Math.min(d.length - 1, Math.floor(d.length * n))];
console.log(`frames ${d.length}  p50 ${q(0.5)}ms  p90 ${q(0.9)}ms  p99 ${q(0.99)}ms  max ${d[d.length - 1]}ms  >33ms ${Math.round((100 * d.filter((x) => x > 33).length) / d.length)}%`);
console.log('long>200ms', JSON.stringify(long.filter((l) => l[1] > 200)), 'level now', await p.evaluate(() => document.documentElement.dataset.perf));
// Frames where the page scrolled but the camera did not move: scroll with no answer.
let still = 0, moving = 0;
for (let i = 1; i < fr.length; i++) {
  const dy = fr[i].y - fr[i - 1].y;
  if (Math.abs(dy) < 1) continue;
  moving++;
  if (Math.abs(fr[i].dist - fr[i - 1].dist) < 0.0005) still++;
}
console.log(`scrolling frames ${moving}, of which camera-still ${still} (${Math.round((100 * still) / Math.max(moving, 1))}%)`);
// The slowest frames, with where they happened.
console.log('worst', JSON.stringify(fr.slice(3).sort((a, b) => b.dt - a.dt).slice(0, 12)));
await b.close();
