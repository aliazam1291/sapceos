// Does WebGL keep drawing when its canvas is nowhere near the viewport?
//
// Counts real GL draw calls PER CANVAS by tagging each context at creation, so
// a stubborn loop can be attributed to a specific scene instead of guessed at.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

await p.addInitScript(() => {
  window.__gl = {};
  let n = 0;
  const getCtx = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = getCtx.call(this, type, ...rest);
    if (ctx && /webgl/.test(type) && !ctx.__tag) {
      ctx.__tag = 'gl' + n++;
      ctx.__canvas = this;
      window.__gl[ctx.__tag] = 0;
    }
    return ctx;
  };
  for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) {
    for (const m of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const orig = C.prototype[m];
      if (!orig) continue;
      C.prototype[m] = function (...a) {
        if (this.__tag) window.__gl[this.__tag]++;
        return orig.apply(this, a);
      };
    }
  }
  window.__where = () =>
    Object.fromEntries(
      Object.entries(window.__gl).map(([k, v]) => {
        const c = [...document.querySelectorAll('canvas')].find((x) => x.__ctxTag === k);
        return [k, v];
      }),
    );
});

await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length > 1, null, { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(3500);

const rate = async (label) => {
  const a = await p.evaluate(() => ({ ...window.__gl }));
  await p.waitForTimeout(2000);
  const c = await p.evaluate(() => ({ ...window.__gl }));
  const per = Object.keys(c).map((k) => `${k}: ${Math.round((c[k] - a[k]) / 2)}/s`);
  console.log(label.padEnd(26), per.join('   '));
};

console.log('hidden?', await p.evaluate(() => document.hidden), ' contexts:', await p.evaluate(() => Object.keys(window.__gl).length));
await rate('at the top');
await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await p.waitForTimeout(2500);
await rate('scrolled to the bottom');
console.log('rects:', await p.evaluate(() =>
  [...document.querySelectorAll('canvas')].map((c) => {
    const r = c.getBoundingClientRect();
    return `${Math.round(r.top)}..${Math.round(r.bottom)}${r.bottom > 0 && r.top < innerHeight ? ' ON' : ''}`;
  }).join(' | ')));
await b.close();
