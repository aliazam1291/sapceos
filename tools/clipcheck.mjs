// Where is the galaxy being clipped, and by what?
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const route of ['/', '/galaxy']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 2, null, { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(3500);
  console.log(`\n── ${route}`);
  console.log(await p.evaluate(() => {
    const out = [];
    for (const c of document.querySelectorAll('canvas')) {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      // Walk up for anything that crops or fades this canvas.
      const croppers = [];
      for (let n = c.parentElement; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n);
        const nr = n.getBoundingClientRect();
        if (s.overflow !== 'visible' && (r.left < nr.left - 1 || r.right > nr.right + 1 || r.top < nr.top - 1 || r.bottom > nr.bottom + 1)) {
          croppers.push(`${String(n.className).split(' ')[0].slice(0, 30)} overflow:${s.overflow} crops to ${Math.round(nr.width)}x${Math.round(nr.height)}`);
        }
        if (s.maskImage && s.maskImage !== 'none') croppers.push(`${String(n.className).split(' ')[0].slice(0, 30)} MASK ${s.maskImage.slice(0, 60)}`);
      }
      if (cs.maskImage && cs.maskImage !== 'none') croppers.push(`SELF MASK ${cs.maskImage.slice(0, 70)}`);
      out.push(`canvas ${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.left)},${Math.round(r.top)}${croppers.length ? '\n      ' + croppers.join('\n      ') : '  (no crop/mask)'}`);
    }
    return out.join('\n  ');
  }));
  await p.close();
}
await b.close();
