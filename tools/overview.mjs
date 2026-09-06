import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
await p.waitForTimeout(12000);
// The toggle is hidden at desktop width in the old CSS; click it directly.
const btn = await p.$('button[aria-controls="nav-overview"]');
if (!btn) { console.log('TOGGLE NOT FOUND'); }
else {
  await btn.click({ force: true });
  await p.waitForTimeout(1200);
  const has = await p.$('#nav-overview');
  console.log('overview open:', !!has);
}
await p.screenshot({ path:'tools/shots/B1-overview.png', timeout: 90000 });
console.log('errors:', errs.slice(0,3).join(' | ')||'none');
await b.close();
