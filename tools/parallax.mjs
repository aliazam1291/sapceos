// Does the sky lean with the pointer, and does it lean by DEPTH?
//
// True parallax means near stars swing further than distant ones. Measuring the
// median displacement of lit pixels between two cursor positions confirms the
// field moves; comparing the spread confirms it is not a uniform slide.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/about', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);

await p.evaluate(() => {
  const c = document.querySelector('canvas');
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  // Alpha stands in for depth: bright pixels are the near stars, faint ones the
  // distant field. Sampling the two bands separately is what shows whether the
  // lean is depth-scaled or a uniform slide.
  window.__lit = (lo, hi) => {
    const d = g.getImageData(0, 0, W, H).data;
    const pts = [];
    for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
      const a = d[(y * W + x) * 4 + 3];
      if (a > lo && a <= hi) pts.push([x, y]);
    }
    return pts;
  };
  window.__flow = (A, B) => {
    const cell = 30, grid = new Map();
    for (const [x, y] of B) {
      const k = ((x / cell) | 0) + ',' + ((y / cell) | 0);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push([x, y]);
    }
    const out = [];
    for (const [x, y] of A) {
      let best = Infinity;
      const gx = (x / cell) | 0, gy = (y / cell) | 0;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        for (const [bx, by] of grid.get(gx + i + ',' + (gy + j)) || [])
          best = Math.min(best, Math.hypot(bx - x, by - y));
      }
      if (best < Infinity) out.push(best);
    }
    out.sort((u, v) => u - v);
    return out;
  };
});

// A half-width sweep, so no displacement outruns the matcher's search radius
// and gets silently dropped.
const at = async (x, band) => {
  await p.mouse.move(x, 450);
  await p.waitForTimeout(1400);
  return p.evaluate((b) => window.__lit(b[0], b[1]), band);
};

for (const [name, band] of [['near (bright)', [170, 255]], ['far (faint) ', [26, 60]]]) {
  const a = await at(420, band);
  const c = await at(1020, band);
  const d = await p.evaluate(([A, B]) => window.__flow(A, B), [a, c]);
  const med = d.length ? d[Math.floor(d.length / 2)] : 0;
  console.log(`${name}  ${String(d.length).padStart(5)} px tracked · median shift ${med.toFixed(1)}px`);
}
await b.close();
