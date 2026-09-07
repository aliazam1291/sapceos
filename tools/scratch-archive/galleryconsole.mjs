import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
p.on('console', (m) => logs.push(m.text()));
await p.goto(BASE + '/', { waitUntil: 'load' });
const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + 5);
await p.waitForFunction(() => document.querySelector('[data-pinned]') !== null, null, { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(4000);

// Sweep a grid of points inside the stage looking for ANY hover log.
const hits = [];
for (const x of [600, 700, 760, 800, 850]) {
  for (const y of [320, 380, 420, 460, 520]) {
    logs.length = 0;
    await p.mouse.move(x, y);
    await p.waitForTimeout(150);
    if (logs.some((l) => l.includes('[card]'))) hits.push([x, y, logs.filter(l=>l.includes('[card]'))]);
  }
}
console.log('hover hits:', JSON.stringify(hits));

// Also check what element is topmost at a candidate point, DOM-side.
const topmost = await p.evaluate(() => {
  const el = document.elementFromPoint(760, 420);
  return el ? `${el.tagName}.${el.className}` : null;
});
console.log('elementFromPoint(760,420):', topmost);

await b.close();
