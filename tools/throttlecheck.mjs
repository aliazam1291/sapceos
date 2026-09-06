// Proves scroll is a throttle on the star layer, by measuring how far the
// stars actually travel between two frames.
//
// For each of the brightest pixels in frame A, find the distance to the nearest
// lit pixel in frame B (grid-indexed). The median of those distances is the
// per-frame displacement of the field. Rest / scroll-down / scroll-up should be
// three clearly different numbers if scroll is genuinely the throttle.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000/about', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);

await p.evaluate(() => {
  const c = document.querySelectorAll('canvas')[0];
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  const lit = () => {
    const d = g.getImageData(0, 0, W, H).data;
    const pts = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = d[(y * W + x) * 4 + 3];
      if (a > 90) pts.push([x, y, a]);
    }
    return pts;
  };
  window.__flow = async (step, ms) => {
    const A = lit().sort((u, v) => v[2] - u[2]).slice(0, 250);
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      if (step) window.scrollBy(0, step);
      await new Promise((r) => requestAnimationFrame(r));
    }
    const B = lit();
    const cell = 24, grid = new Map();
    for (const [x, y] of B) {
      const k = ((x / cell) | 0) + ',' + ((y / cell) | 0);
      (grid.get(k) || grid.set(k, []).get(k)).push([x, y]);
    }
    const ds = [];
    for (const [x, y] of A) {
      let best = Infinity;
      const gx = (x / cell) | 0, gy = (y / cell) | 0;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
        for (const [bx, by] of grid.get(gx + i + ',' + (gy + j)) || [])
          best = Math.min(best, Math.hypot(bx - x, by - y));
      }
      if (best < Infinity) ds.push(best);
    }
    ds.sort((u, v) => u - v);
    return { median: +ds[ds.length >> 1].toFixed(2), matched: ds.length };
  };
});

const show = async (label, step) => {
  const r = await p.evaluate(([s, m]) => window.__flow(s, m), [step, 500]);
  console.log(label.padEnd(16), 'median travel', String(r.median).padStart(6), 'px in 0.5s');
};

await show('at rest', 0);
await p.evaluate(() => window.scrollTo(0, 900));
await p.waitForTimeout(800);
await show('scrolling down', 26);
await p.evaluate(() => window.scrollTo(0, 2800));
await p.waitForTimeout(800);
await show('scrolling up', -26);
await b.close();
