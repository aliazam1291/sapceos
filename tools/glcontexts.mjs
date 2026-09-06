// Counts actual WebGL contexts CREATED (getContext calls that succeed for
// webgl/webgl2), tagging each so we know which canvas each belongs to and
// whether it survives scroll rather than merely pausing its draw loop.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

await p.addInitScript(() => {
  window.__ctxCount = 0;
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (ctx && /webgl/i.test(type) && !this.__counted) {
      this.__counted = true;
      window.__ctxCount++;
    }
    return ctx;
  };
});

await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);

const report = async (label) => {
  const n = await p.evaluate(() => document.querySelectorAll('canvas').length);
  const live = await p.evaluate(() => window.__ctxCount);
  console.log(`${label.padEnd(28)} canvases in DOM: ${n}  ·  WebGL contexts EVER created: ${live}`);
};

await report('top of page');
const docH = await p.evaluate(() => document.documentElement.scrollHeight);
await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), docH * 0.45);
await p.waitForTimeout(2000);
await report('mid-page (flight section)');
await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
await p.waitForTimeout(2500);
await report('bottom (footer horizon)');

await b.close();
