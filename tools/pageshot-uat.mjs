// Viewport screenshots of a route at a list of scroll positions, with the
// boot screen skipped. For looking at a page the way a reader does when the
// desktop app's browser pane is too contended to draw (2026-09-19).
//
//   node tools/pageshot-uat.mjs /missions 0,900,1800
//   BASE=http://localhost:3210 VW=412 VH=823 node tools/pageshot-uat.mjs /about 0
//
// Writes tools/shots/page-<route>-<y>.png. Waits for the ship's canvas so
// the companion is in the frame, then a settle for the spring to land.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const route = process.argv[2] ?? '/';
const ys = (process.argv[3] ?? '0').split(',').map(Number);
const VW = +(process.env.VW ?? 1440);
const VH = +(process.env.VH ?? 900);
fs.mkdirSync('tools/shots', { recursive: true });

const b = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: VW, height: VH } });
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
await p.goto(BASE + route, { waitUntil: 'load', timeout: 150000 });
await p.waitForTimeout(2500);
for (const y of ys) {
  await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
  await p.waitForTimeout(2600);
  const name = `tools/shots/page-${route.replace(/\//g, '_') || '_root'}-${y}.png`;
  await p.screenshot({ path: name });
  console.log('wrote', name);
}
await b.close();
