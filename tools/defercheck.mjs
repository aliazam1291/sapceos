// Is the 3D bundle actually deferred, or does it race the text?
//
// DESIGN_DIRECTION.md: "Three.js must never be in the first-paint bundle.
// Dynamic-import every scene, gated behind idle and/or intersection."
// A dynamic import with no gate still starts downloading the moment the
// component hydrates, which is exactly when the text is trying to paint.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

const reqs = [];
p.on('request', (r) => {
  if (r.resourceType() === 'script') reqs.push({ url: r.url().split('/').pop(), t: Date.now() });
});
await p.addInitScript(() => {
  window.__marks = {};
  new PerformanceObserver((l) => {
    window.__marks.lcp = Math.round(l.getEntries().at(-1).startTime);
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__marks.fcp = Math.round(e.startTime);
  }).observe({ type: 'paint', buffered: true });
});

const t0 = Date.now();
await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length > 1, null, { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(3000);

const marks = await p.evaluate(() => window.__marks);
// Find the heaviest script; that is the three.js/R3F chunk.
const sizes = await p.evaluate(() =>
  performance.getEntriesByType('resource')
    .filter((r) => r.initiatorType === 'script' || r.name.endsWith('.js'))
    .map((r) => ({ n: r.name.split('/').pop(), size: r.transferSize, start: Math.round(r.startTime), end: Math.round(r.responseEnd) }))
    .sort((a, c) => c.size - a.size)
    .slice(0, 4));

console.log(`FCP ${marks.fcp}ms · LCP ${marks.lcp}ms`);
for (const s of sizes) {
  const verdict = s.start < marks.lcp ? `⚠ starts BEFORE LCP (${marks.lcp}ms)` : 'after LCP';
  console.log(`  ${String(Math.round(s.size / 1024)).padStart(4)}kb  requested at ${String(s.start).padStart(5)}ms  ${verdict}`);
}
await b.close();
