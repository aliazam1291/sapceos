// The approach into the pinned flight: is anything visible but cut off before
// the pin engages? That transition is where the section looked broken.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);

// Walk through the approach, from a screen before the pin to just after it.
for (const off of [-700, -450, -220, -60, 0, 120]) {
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + off);
  await p.waitForTimeout(900);
  console.log(`offset ${String(off).padStart(5)}:`, await p.evaluate(() => {
    const screen = document.querySelector('[class*="screen"][data-live]');
    const pinned = screen.hasAttribute('data-pinned');
    const bad = [];
    for (const sel of ['[class*="copy"]', '[class*="rail"]', '[class*="hud"]']) {
      const el = screen.querySelector(':scope > ' + sel);
      if (!el) continue;
      const vis = Number(getComputedStyle(el).opacity) > 0.05;
      const r = el.getBoundingClientRect();
      const cut = r.bottom > innerHeight + 2 || r.top < -2;
      if (vis && cut) bad.push(sel.replace(/\[class\*="|"\]/g, ''));
    }
    return `pinned=${pinned} · ${bad.length ? 'VISIBLE BUT CUT: ' + bad.join(', ') : 'nothing visible is cut'}`;
  }));
}
await b.close();
