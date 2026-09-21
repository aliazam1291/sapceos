// Phone stills of every route, real Chrome, for the eye: viewport frames
// down the page (a full-page shot repeats sticky sections and times out on
// canvases), assembled into one contact sheet per route.
//   CHROME=1 BASE=https://aliazamkazmi.vercel.app node tools/mobile-shots.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import sharp from 'sharp';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const routes = (process.env.ROUTES ?? '/,/missions,/missions/vahan-shakti,/field-notes,/about,/contact,/writing,/studio').split(',');
const OUT = process.env.OUT ?? 'tools/shots/phone';
const W = 390, H = 844;
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
for (const r of routes) {
  await p.goto(BASE + r, { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(2500);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const name = r === '/' ? 'home' : r.slice(1).replace(/\//g, '-');
  const n = Math.min(Number(process.env.FRAMES ?? (r === '/' ? 14 : 8)), Math.ceil(total / H));
  const frames = [];
  for (let i = 0; i < n; i++) {
    const y = Math.round((i * (total - H)) / Math.max(1, n - 1));
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(1100);
    frames.push(await p.screenshot({ type: 'png', timeout: 60000 }));
  }
  const cols = Math.min(n, 7), rows = Math.ceil(n / cols), w = W, h = H;
  const comps = await Promise.all(frames.map(async (buf, i) => ({ input: await sharp(buf).resize(w).toBuffer(), left: (i % cols) * (w + 8), top: Math.floor(i / cols) * (h + 8) })));
  await sharp({ create: { width: cols * (w + 8), height: rows * (h + 8), channels: 3, background: '#444' } }).composite(comps).jpeg({ quality: 78 }).toFile(`${OUT}/${name}-sheet.jpg`);
  console.log(name, 'H', total, 'frames', n);
}
await b.close();
