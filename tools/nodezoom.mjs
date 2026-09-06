// Blows up a single galaxy node so the ring / rim / hull treatment can be
// judged at the size the eye actually reads it.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(BASE + (process.argv[3] ?? '/galaxy'), { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 1, null, { timeout: 40000 }).catch(() => {});
await p.waitForTimeout(4000);
const [x, y, w, h] = (process.argv[2] ?? '440,540,220,200').split(',').map(Number);
await p.screenshot({ path: 'tools/shots/Z-node.png', clip: { x, y, width: w, height: h }, timeout: 120000 });
console.log('crop', x, y, w, h);
await b.close();
