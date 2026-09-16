import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const ROUTE = process.argv[2] ?? '/';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + ROUTE, { waitUntil: 'load' });
await p.waitForTimeout(3000);
const total = await p.evaluate(() => document.body.scrollHeight);
console.log('scrollHeight', total);
const step = 900;
let i = 0;
for (let y = 0; y < total; y += step) {
  await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `tools/shots/scan-${String(i).padStart(2,'0')}.png` });
  i++;
}
console.log('wrote', i, 'shots');
await b.close();
