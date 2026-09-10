/*
 * Is the hero galaxy's canvas actually the size of the stage it was given?
 *
 * R3F sizes its <canvas> from a measurement of the wrapper. If that
 * measurement never lands, the element keeps the HTML default 300x150 and
 * the galaxy renders as a small cluster in the corner of a large panel —
 * with no CSS anywhere to explain it, because nothing is wrong with the CSS.
 * HeroStage.tsx already carries a post-mortem of a related failure (animating
 * `scale` on the R3F host corrupted the measurement), so this is a known
 * hazard on this element specifically.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const [w, h] of [[1440, 900], [2000, 1000]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  // The galaxy is idle-gated, so give it time to mount and settle.
  await p.waitForTimeout(6000);
  const r = await p.evaluate(() => {
    const panel = document.querySelector('[class*="heroPanel"]');
    const canvas = panel?.querySelector('canvas');
    if (!panel || !canvas) return { err: 'panel or canvas missing' };
    const pr = panel.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    return {
      panel: [Math.round(pr.width), Math.round(pr.height)],
      canvas: [Math.round(cr.width), Math.round(cr.height)],
      fillPct: Math.round((cr.width * cr.height) / (pr.width * pr.height) * 100),
      defaultSized: Math.round(cr.width) === 300 && Math.round(cr.height) === 150,
    };
  });
  const verdict = r.err ? r.err : r.defaultSized
    ? '*** NEVER MEASURED (300x150 default) ***'
    : r.fillPct >= 90 ? 'fills the stage' : `only ${r.fillPct}% of the stage`;
  console.log(`${w}x${h}  panel ${r.panel?.join('x')}  canvas ${r.canvas?.join('x')}  ${verdict}`);
  await p.close();
}
await b.close();
