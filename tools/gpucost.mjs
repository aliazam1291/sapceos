/*
 * WebGL cost probe.
 *
 * Answers three questions that guesswork gets wrong:
 *   1. How many WebGL contexts does a page actually create over a full scroll?
 *   2. How many are still ALIVE at the end (contexts are not freed by being
 *      scrolled past — a paused loop still holds its context and its VRAM)?
 *   3. Is each scene's frame loop genuinely stopping when it leaves the
 *      viewport, or only claiming to?
 *
 * (3) is the one that matters most for GPU: a paused context costs memory, a
 * running one costs a core. It is measured by counting real draw calls through
 * a patched drawElements/drawArrays, per context, per scroll position.
 *
 * Usage: BASE=http://localhost:3210 node tools/gpucost.mjs [route]
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const ROUTE = process.argv[2] ?? '/';

const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });

await p.addInitScript(() => {
  const contexts = [];
  window.__gl = contexts;
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (ctx && /webgl/.test(String(type))) {
      const rec = { id: contexts.length, draws: 0, canvas: this, ctx };
      contexts.push(rec);
      for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced']) {
        if (typeof ctx[fn] !== 'function') continue;
        const f = ctx[fn].bind(ctx);
        ctx[fn] = (...a) => { rec.draws++; return f(...a); };
      }
    }
    return ctx;
  };
});

await p.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);

const sample = async (label) => {
  // Zero the counters, wait a fixed wall-clock window, read them back. Draw
  // calls per second per context is the honest measure of who is burning GPU.
  await p.evaluate(() => window.__gl.forEach((c) => (c.draws = 0)));
  await p.waitForTimeout(2000);
  const rows = await p.evaluate(() =>
    window.__gl.map((c) => ({
      id: c.id,
      dps: Math.round(c.draws / 2),
      lost: c.ctx.isContextLost(),
      onScreen: (() => {
        const r = c.canvas.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      })(),
    })),
  );
  console.log(`\n[${label}] contexts=${rows.length}`);
  for (const r of rows) {
    console.log(
      `  ctx${r.id}  draws/s=${String(r.dps).padStart(5)}  ` +
        `${r.onScreen ? 'ON-SCREEN ' : 'off-screen'}  ${r.lost ? 'LOST' : 'live'}`,
    );
  }
  const wasted = rows.filter((r) => !r.onScreen && r.dps > 0);
  if (wasted.length) {
    console.log(`  !! ${wasted.length} off-screen context(s) still drawing`);
  }
  return rows;
};

await sample('top of page');

const stops = [0.5, 1.2, 2.5, 4, 6];
for (const s of stops) {
  await p.evaluate((f) => window.scrollTo(0, window.innerHeight * f), s);
  await p.waitForTimeout(1200);
}
await sample('after full scroll (bottom)');

await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(2000);
const final = await sample('back at top');

console.log(`\ntotal contexts created over the visit: ${final.length}`);
await b.close();
