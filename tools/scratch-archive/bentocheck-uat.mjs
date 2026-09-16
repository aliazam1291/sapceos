import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 200)));
await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForTimeout(2000);
const y = await p.evaluate(() => {
  const el = document.querySelector('[class*="objectCaption"]') || document.querySelector('[class*="Bento_object"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return window.scrollY + r.top - 200;
});
console.log('bento object section y =', y);
if (y != null) {
  await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
  await p.waitForTimeout(6000);
  const canvasCount = await p.evaluate(() => document.querySelectorAll('[class*="Bento"] canvas, [class*="canvasHost"] canvas').length);
  console.log('canvases in bento tile:', canvasCount);
  await p.screenshot({ path: 'tools/shots/bento-check.png' });
}
console.log('console/page errors:', errs.length ? errs : 'none');
await b.close();
