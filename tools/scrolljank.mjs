/*
 * Frame pacing while the page is actually being scrolled.
 *
 * Long-task counts miss the thing a reader calls "lag": a steady stream of
 * 30-50ms frames, each individually under the 50ms longtask threshold. So this
 * samples rAF deltas directly and reports the distribution, not a mean — a mean
 * of 20ms hides a p95 of 90ms, and the p95 is what gets felt.
 *
 * Also reports with the starfield forced off, to attribute cost rather than
 * guess at it.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const ROUTE = process.env.ROUTE ?? '/';

const probe = async (p, label) => {
  await p.evaluate(() => {
    window.__f = [];
    let last = performance.now();
    const tick = (now) => { window.__f.push(now - last); last = now; window.__r = requestAnimationFrame(tick); };
    window.__r = requestAnimationFrame(tick);
  });

  // Scroll in realistic increments rather than one jump: a single scrollTo
  // does not exercise the damped loops that react to scroll velocity.
  for (let i = 0; i < 40; i++) {
    await p.mouse.wheel(0, 120);
    await p.waitForTimeout(50);
  }

  const f = await p.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f; });
  const s = f.slice(5).sort((a, b) => a - b);
  if (!s.length) return console.log(`${label}: no frames`);
  const q = (n) => s[Math.floor(s.length * n)].toFixed(1);
  const over = (ms) => ((s.filter((x) => x > ms).length / s.length) * 100).toFixed(0);
  console.log(
    `${label.padEnd(26)} frames:${String(s.length).padStart(4)}  ` +
    `p50:${q(0.5).padStart(6)}ms  p95:${q(0.95).padStart(6)}ms  max:${s[s.length-1].toFixed(0).padStart(4)}ms  ` +
    `>32ms:${over(32).padStart(3)}%  >100ms:${over(100).padStart(3)}%`,
  );
};

const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

// Baseline: everything on.
const p1 = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p1.goto(BASE + ROUTE, { waitUntil: 'load' });
await p1.waitForTimeout(6000);
await probe(p1, 'all on');

// Starfield removed. Same page, same scroll, one variable changed.
await p1.evaluate(() => document.querySelectorAll('[class*=deepSpace], [class*=DeepSpace]').forEach((e) => e.remove()));
await p1.evaluate(() => window.scrollTo(0, 0));
await p1.waitForTimeout(1500);
await probe(p1, 'starfield removed');

// Also drop every WebGL canvas, to separate 3D cost from the 2D field.
await p1.evaluate(() => document.querySelectorAll('canvas').forEach((e) => e.remove()));
await p1.evaluate(() => window.scrollTo(0, 0));
await p1.waitForTimeout(1500);
await probe(p1, 'all canvases removed');

await b.close();
