// When, relative to page load, does each of the three big canvases actually
// create its WebGL context — and is that tied to scroll proximity at all, or
// does it fire regardless of where the reader currently is?
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

await p.addInitScript(() => {
  window.__log = [];
  const t0 = performance.now();
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (ctx && /webgl/i.test(type) && !this.__counted) {
      this.__counted = true;
      const r = this.getBoundingClientRect();
      window.__log.push({ t: Math.round(performance.now() - t0), top: Math.round(r.top + scrollY) });
    }
    return ctx;
  };
});

// Stay at scroll 0 the WHOLE time — never scroll down. If MissionFlight or
// FooterHorizon still create a context, they are not gated by proximity.
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
console.log(await p.evaluate(() => window.__log));
await b.close();
