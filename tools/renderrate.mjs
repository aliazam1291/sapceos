/*
 * Renders per second, per WebGL context.
 *
 * Draw calls per second alone cannot tell a well-optimised scene from a frozen
 * one — both report a small number. three.js issues exactly one gl.clear() at
 * the start of each render, so counting clears counts FRAMES, and dividing
 * draws by it gives draws-per-frame. Together those two separate the three
 * cases that matter: fewer frames (the intent), fewer draws per frame (also the
 * intent), or nothing rendering at all (a bug wearing the costume of a win).
 *
 * Deliberately does NOT patch requestAnimationFrame: wrapping rAF perturbs
 * R3F's own loop and reports the instrumentation's rate rather than the page's.
 *
 * Usage: BASE=http://localhost:3210 MSYS_NO_PATHCONV=1 node tools/renderrate.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const SECONDS = 4;

const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });

await p.addInitScript(() => {
  const ctxs = [];
  window.__gl = ctxs;
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (ctx && /webgl/.test(String(type))) {
      const rec = { draws: 0, clears: 0, canvas: this };
      ctxs.push(rec);
      for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced']) {
        if (typeof ctx[fn] !== 'function') continue;
        const f = ctx[fn].bind(ctx);
        ctx[fn] = (...a) => { rec.draws++; return f(...a); };
      }
      const c = ctx.clear.bind(ctx);
      ctx.clear = (...a) => { rec.clears++; return c(...a); };
    }
    return ctx;
  };
});

await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);

await p.evaluate(() => window.__gl.forEach((c) => { c.draws = 0; c.clears = 0; }));
await p.waitForTimeout(SECONDS * 1000);

const rows = await p.evaluate((s) =>
  window.__gl.map((c, i) => {
    const r = c.canvas.getBoundingClientRect();
    return {
      i,
      fps: +(c.clears / s).toFixed(1),
      dps: Math.round(c.draws / s),
      perFrame: c.clears ? +(c.draws / c.clears).toFixed(1) : 0,
      on: r.bottom > 0 && r.top < window.innerHeight,
    };
  }), SECONDS);

for (const r of rows) {
  console.log(
    `ctx${r.i}  ${r.on ? 'ON-SCREEN ' : 'off-screen'}  ` +
      `renders/s=${String(r.fps).padStart(6)}  draws/s=${String(r.dps).padStart(5)}  ` +
      `draws/frame=${r.perFrame}`,
  );
}

await b.close();
