import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + (process.argv[3] ?? '/'), { waitUntil: 'load' });
await p.waitForTimeout(3000);
await p.screenshot({ path: process.argv[2] || 'tools/shots/fullpage.png', fullPage: true });
console.log('wrote', process.argv[2] || 'tools/shots/fullpage.png');
await b.close();
