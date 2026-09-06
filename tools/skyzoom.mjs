// Blows up a patch of empty sky so the star rendering can be judged at the
// size the eye actually resolves it, rather than as a general impression.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
await p.goto(BASE + (process.argv[3] ?? '/about'), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
const cdp = await p.context().newCDPSession(p);
const [x, y, w, h] = (process.argv[2] ?? '900,120,300,220').split(',').map(Number);
const data = (await cdp.send('Page.captureScreenshot', {
  format: 'png', clip: { x, y, width: w, height: h, scale: 3 }, captureBeyondViewport: false,
})).data;
writeFileSync('tools/shots/SKY.png', Buffer.from(data, 'base64'));
console.log('sky crop', x, y, w, h, '@3x');
await b.close();
