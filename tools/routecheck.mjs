// Console/page-error sweep across every route, after the 3D has settled.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const routes = ['/', '/missions', '/galaxy', '/lab', '/orbit', '/field-notes', '/about', '/mission-history', '/contact'];
let bad = 0;
for (const r of routes) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 120)));
  await p.goto(BASE + r, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  const ok = errs.length === 0;
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + r.padEnd(18), ok ? '' : errs.slice(0, 2).join(' | '));
  await p.close();
}
console.log(bad ? `${bad} route(s) with errors` : 'all routes clean');
await b.close();
