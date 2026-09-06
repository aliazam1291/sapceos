// The Overview panel: does it open, is the way out visible, does it close?
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await p.context().newCDPSession(p);
const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
await p.click('button[aria-controls="nav-overview"]');
await p.waitForTimeout(1500);
writeFileSync('tools/shots/OV.png', Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));

console.log(await p.evaluate(() => {
  const panel = document.querySelector('[role="dialog"]');
  // Scope to the dialog — the command dock's toggle also reads "Close" while open.
  const close = panel.querySelector('button');
  if (!panel || !close) return 'MISSING panel or close button';
  const pr = panel.getBoundingClientRect();
  const cr = close.getBoundingClientRect();
  const top = document.elementFromPoint(cr.x + cr.width / 2, cr.y + cr.height / 2);
  return `panel ${Math.round(pr.width)}x${Math.round(pr.height)} at ${Math.round(pr.x)},${Math.round(pr.y)} · close visible+topmost: ${close.contains(top) || top === close}`;
}));

// Close by its own button.
await p.click('[role="dialog"] button');
await p.waitForTimeout(900);
console.log('closes via panel button :', await p.evaluate(() => !document.getElementById('nav-overview')));

// Reopen, close by clicking the dimmed page.
await p.click('button[aria-controls="nav-overview"]');
await p.waitForTimeout(1000);
await p.mouse.click(40, 40);
await p.waitForTimeout(900);
console.log('closes via backdrop     :', await p.evaluate(() => !document.getElementById('nav-overview')));
console.log('errors                  :', errs.length ? errs : 'none');
await b.close();
