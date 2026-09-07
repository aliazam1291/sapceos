import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForTimeout(3000);
for (const y of [1600, 2000, 2400, 2800, 3200]) {
  await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `tools/shots/pin-${y}.png` });
}
console.log('done');
await b.close();
