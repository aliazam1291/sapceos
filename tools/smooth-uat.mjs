// Does it feel smooth? Real Chrome (CHROME=1, the real GPU — SwiftShader
// numbers are meaningless for this), production build. For each route: rAF
// frame-time distribution while idle at the top, while scrolling the whole
// page at reading pace, and idle at a few section positions; the count of
// running CSS animations; and the long tasks that landed during the scroll.
// p50/p95 frame times are what a reader calls lag — a mean hides them.
//
//   CHROME=1 node tools/smooth-uat.mjs                    (all routes)
//   CHROME=1 ROUTES=/,/missions node tools/smooth-uat.mjs
//   CHROME=1 MOBILE=1 node tools/smooth-uat.mjs           (412×823, touch)
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const routes = (process.env.ROUTES ?? '/,/missions,/studio,/field-notes,/about,/missions/vahan-shakti,/decisions,/contact').split(',');
const mobile = !!process.env.MOBILE;
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const ctx = await b.newContext(mobile ? { viewport: { width: 412, height: 823 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.addInitScript(() => {
  sessionStorage.setItem('space-os:booted', '1');
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true });
});

const pct = (arr, q) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]) : 0;
};
const sample = (ms) =>
  p.evaluate(
    (ms) =>
      new Promise((res) => {
        const d = [];
        let last = performance.now();
        const t0 = last;
        const f = (now) => {
          d.push(now - last);
          last = now;
          if (now - t0 < ms) requestAnimationFrame(f);
          else res(d);
        };
        requestAnimationFrame(f);
      }),
    ms,
  );
// A reading-pace scroll: ~1100px/s in 60ms steps, sampled at the same time.
const scrollAndSample = () =>
  p.evaluate(
    () =>
      new Promise((res) => {
        const H = document.documentElement.scrollHeight - innerHeight;
        const d = [];
        let last = performance.now();
        const t0 = last;
        const dur = Math.min(14000, Math.max(3000, (H / 1100) * 1000));
        const f = (now) => {
          d.push(now - last);
          last = now;
          const k = Math.min(1, (now - t0) / dur);
          window.scrollTo(0, H * k);
          if (k < 1) requestAnimationFrame(f);
          else res({ d, dur: Math.round(dur), H });
        };
        requestAnimationFrame(f);
      }),
  );
const anims = () => p.evaluate(() => ({ css: document.getAnimations().filter((a) => a.playState === 'running').length, canvases: document.querySelectorAll('canvas').length }));

const rows = [];
for (const route of routes) {
  await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
  // INJECT_CSS='…' adds a style tag — for attributing cost by switching a
  // suspect off (e.g. INJECT_CSS='.x{mix-blend-mode:normal}').
  if (process.env.INJECT_CSS) await p.addStyleTag({ content: process.env.INJECT_CSS });
  await p.waitForTimeout(3500);
  await p.evaluate(() => (window.__long = []));
  const idleTop = await sample(2000);
  const a0 = await anims();
  const scroll = await scrollAndSample();
  const longs = await p.evaluate(() => window.__long);
  await p.waitForTimeout(800);
  const idleEnd = await sample(1500);
  const a1 = await anims();
  rows.push({
    route,
    'idle p50/p95': `${pct(idleTop, 0.5)}/${pct(idleTop, 0.95)}ms`,
    'scroll p50/p95': `${pct(scroll.d, 0.5)}/${pct(scroll.d, 0.95)}ms`,
    'scroll >33ms': `${Math.round((100 * scroll.d.filter((x) => x > 33).length) / scroll.d.length)}%`,
    'end p50/p95': `${pct(idleEnd, 0.5)}/${pct(idleEnd, 0.95)}ms`,
    longTasks: longs.length ? `${longs.length} (max ${Math.max(...longs)})` : '0',
    anims: `${a0.css}→${a1.css}`,
    canvases: `${a0.canvases}→${a1.canvases}`,
    height: scroll.H,
  });
  console.log(JSON.stringify(rows[rows.length - 1]));
}
console.table(rows);
await b.close();
