/*
 * What the 2D starfield actually issues per frame, split by pass.
 *
 * The removal experiment in scrolljank.mjs shows the field costs ~16ms of
 * median frame time, but removal cannot say WHY. This counts the drawImage
 * calls that survive culling and the pixels they cover, split into the star
 * pass and the cluster-glow pass, so a fix can be aimed at whichever actually
 * dominates instead of at whichever is easier to see in the source.
 *
 * Stars draw at <=25px (r maxes at 5, sprite is r*5); cluster glows draw at
 * >=48px (culled below d<24, sprite is d*2). 30px cleanly separates them.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';

const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

await p.addInitScript(() => {
  window.__d = { frames: 0, area: 0, starN: 0, starA: 0, glowN: 0, glowA: 0 };
  const proto = CanvasRenderingContext2D.prototype;
  const di = proto.drawImage;
  proto.drawImage = function (...a) {
    if (a.length >= 5) {
      const w = a[3] || 0, h = a[4] || 0;
      window.__d.area += w * h;
      if (w >= 30) { window.__d.glowN++; window.__d.glowA += w * h; }
      else { window.__d.starN++; window.__d.starA += w * h; }
    }
    return di.apply(this, a);
  };
  const cr = proto.clearRect;
  // clearRect runs exactly once per starfield frame, so it marks frame edges.
  proto.clearRect = function (...a) { window.__d.frames++; return cr.apply(this, a); };
});

await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForTimeout(5000);

const sample = async (label) => {
  await p.evaluate(() => { for (const k in window.__d) window.__d[k] = 0; });
  await p.waitForTimeout(3000);
  const d = await p.evaluate(() => window.__d);
  const f = d.frames || 1;
  const M = (x) => (x / f / 1e6).toFixed(2) + 'M';
  console.log(
    `${label.padEnd(14)} fps:${(d.frames / 3).toFixed(1).padStart(5)}  total:${M(d.area).padStart(7)}  ` +
    `stars ${String(Math.round(d.starN / f)).padStart(4)}x ->${M(d.starA).padStart(7)}  ` +
    `glows ${String(Math.round(d.glowN / f)).padStart(3)}x ->${M(d.glowA).padStart(7)}   (viewport 1.30M)`,
  );
};

await sample('idle');
await p.evaluate(() => window.scrollTo(0, 600));
await sample('after scroll');

await b.close();
