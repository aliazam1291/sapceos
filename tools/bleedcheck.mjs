// Does the flight stage actually fill the viewport, and do the text elements
// still line up with the rest of the page?
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const w of [1440, 2560, 3440, 3840]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + 5 * 0.6 * 900 * 0.3);
  await p.waitForTimeout(1600);
  console.log(`${String(w).padStart(4)}px:`, await p.evaluate(() => {
    const screen = document.querySelector('[class*="screen"][data-live]');
    const cv = screen.querySelector('canvas');
    const r = cv.getBoundingClientRect();
    const rail = screen.querySelector(':scope > [class*="rail"]');
    const copy = screen.querySelector(':scope > [class*="copy"]');
    // A shell-aligned reference from elsewhere on the page.
    const ref = document.querySelector('#fragments [class*="label"]');
    return `stage ${Math.round(r.width)}x${Math.round(r.height)} at x=${Math.round(r.left)}`
      + ` · full-bleed=${Math.round(r.width) >= innerWidth - 1 && Math.round(r.left) <= 1}`
      + ` · rail x=${Math.round(rail.getBoundingClientRect().left)}`
      + ` · band x=${Math.round(copy.getBoundingClientRect().left)}`
      + ` · page text edge=${ref ? Math.round(ref.getBoundingClientRect().left) : '?'}`;
  }));
  await p.close();
}
await b.close();
