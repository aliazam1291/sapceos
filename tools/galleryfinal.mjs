import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });
const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + 5);
await p.waitForFunction(() => document.querySelector('[data-pinned]') !== null, null, { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(4000);

await p.mouse.click(760, 380);
await p.waitForTimeout(700);
await p.screenshot({ path: 'tools/shots/gallery-selected-final.png' });
const closeVisible = await p.evaluate(() => !!document.querySelector('#method .beat[data-selected] button'));
console.log('close button present on selected article:', closeVisible);

const closeBtn = await p.$('#method .beat[data-selected] button');
if (closeBtn) {
  await closeBtn.click();
  await p.waitForTimeout(400);
  const stillSelected = await p.evaluate(() => document.querySelector('#method article[data-selected]'));
  console.log('after clicking close button:', stillSelected ? 'STILL SELECTED (bug)' : 'cleared, ok');
}

// sr-only nav operability
const navBtn = await p.$('#method nav[aria-label] button');
await navBtn?.focus();
await p.waitForTimeout(500);
const selectedViaFocus = await p.evaluate(() => document.querySelector('#method article[data-selected]')?.querySelector('h2')?.textContent);
console.log('selected via sr-only nav focus:', selectedViaFocus ?? '(none)');

await b.close();
