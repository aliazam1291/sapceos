import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });
const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + 5);
await p.waitForFunction(() => document.querySelector('[data-pinned]') !== null, null, { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(4000);

// Hover near the card centre (roughly where the face renders in the shot above).
await p.mouse.move(760, 420);
await p.waitForTimeout(500);
await p.screenshot({ path: 'tools/shots/gallery-hover.png' });
console.log('hover shot written');

// Click it.
await p.mouse.click(760, 420);
await p.waitForTimeout(700);
const selected = await p.evaluate(() => document.querySelector('#method article[data-selected]')?.querySelector('h2')?.textContent);
console.log('selected after click:', selected ?? '(none)');
await p.screenshot({ path: 'tools/shots/gallery-selected.png' });

// Escape should clear it.
await p.keyboard.press('Escape');
await p.waitForTimeout(500);
const afterEsc = await p.evaluate(() => document.querySelector('#method article[data-selected]'));
console.log('selection after Escape:', afterEsc ? 'STILL SELECTED (bug)' : 'cleared, ok');

await b.close();
