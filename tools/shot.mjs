import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const sel = process.argv[2];
const out = process.argv[3] ?? 'tools/shots/S.png';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + (process.argv[4] ?? '/'), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
const el = await p.$(sel);
if (!el) { console.log('no match for', sel); process.exit(1); }
await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(1800);
await el.screenshot({ path: out });
console.log('wrote', out);
await b.close();
