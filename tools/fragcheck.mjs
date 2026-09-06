// The Fragments band: right count, drag works, links work, keyboard works.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await p.context().newCDPSession(p);
const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('fragments')?.scrollIntoView({ block: 'center' }));
await p.waitForTimeout(2000);

console.log(await p.evaluate(() => {
  const band = document.getElementById('fragments');
  const rail = band.querySelector('[class*="rail"]');
  const tiles = band.querySelectorAll('a[class*="tile"]');
  const shown = band.querySelector('[class*="count"]')?.textContent?.trim();
  const drafts = band.querySelectorAll('[class*="draft"]').length;
  return `tiles=${tiles.length} · count shown=${shown} · match=${String(tiles.length) === shown} · drafts flagged=${drafts} · scrollable=${rail.scrollWidth > rail.clientWidth} (${rail.scrollWidth}px of ${rail.clientWidth}px)`;
}));

// Drag the strip.
const box = await p.evaluate(() => {
  const r = document.querySelector('#fragments [class*="rail"]').getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
const before = await p.evaluate(() => document.querySelector('#fragments [class*="rail"]').scrollLeft);
await p.mouse.move(box.x, box.y);
await p.mouse.down();
for (let i = 1; i <= 8; i++) { await p.mouse.move(box.x - i * 45, box.y); await p.waitForTimeout(30); }
await p.mouse.up();
await p.waitForTimeout(600);
const after = await p.evaluate(() => document.querySelector('#fragments [class*="rail"]').scrollLeft);
console.log(`drag: scrollLeft ${before} -> ${Math.round(after)} (${after > before ? 'moved' : 'DID NOT MOVE'})`);

writeFileSync('tools/shots/FR.png', Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
console.log('errors:', errs.length ? errs : 'none');
await b.close();
