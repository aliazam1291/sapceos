import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForTimeout(3000);
const positions = [0, 800, 1600, 2400, 3200, 4000, 4800];
for (const [i, y] of positions.entries()) {
  await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `tools/shots/section-${i}.png` });
}
console.log('wrote', positions.length, 'section shots');
await b.close();
