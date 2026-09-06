// Screenshots the pinned method sequence at each of its four beats, by
// locating #method in the document and stepping through its scrub range.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:3000';
mkdirSync('tools/shots', { recursive: true });

const b = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 2, null, { timeout: 40000 }).catch(() => {});
await p.waitForTimeout(3000);

const top = await p.evaluate(() => {
  const el = document.getElementById('method');
  return el ? el.getBoundingClientRect().top + window.scrollY : -1;
});
console.log('method top', top);

// 4 beats x 60vh of scrub.
const span = 5 * 0.6 * 900;
for (const [i, f] of [0.08, 0.28, 0.48, 0.68, 0.9].entries()) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + span * f);
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `tools/shots/S${i + 1}.png`, timeout: 120000 });
  console.log('shot S' + (i + 1));
}
await b.close();
