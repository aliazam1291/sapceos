// Is a card's face texture actually drawing content, or still the placeholder?
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });
const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + 5);
await p.waitForFunction(() => document.querySelector('[data-pinned]') !== null, null, { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(4500); // generous — idle-chunked texture build across 10 cards
await p.screenshot({ path: 'tools/shots/gallery-texcheck.png' });
console.log('wrote tools/shots/gallery-texcheck.png');
await b.close();
