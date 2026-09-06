// Proof that keyboard focus drives the 3D, not just the DOM.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await p.context().newCDPSession(p);
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 2, null, { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3500);

const stops = Number(process.argv[2] ?? 16);
await p.evaluate(() => document.body.focus());
for (let i = 0; i < stops; i++) await p.keyboard.press('Tab');
await p.waitForTimeout(2600);
const who = await p.evaluate(() => document.activeElement?.innerText?.trim().slice(0, 40));
const data = (await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data;
writeFileSync(`tools/shots/KBD.png`, Buffer.from(data, 'base64'));
console.log(`focused: ${who}`);
await b.close();
