// Photograph the icon lab (/icon-lab, dev only) into public/icons/*.png:
// transparent 1024px renders of the ship, the landed ship, the relay, a gas
// giant and a world — the site's own models, real GPU (CHROME=1).
//
//   CHROME=1 node tools/icons-build.mjs            (dev server on :3000)
//   CHROME=1 BASE=http://localhost:3001 node tools/icons-build.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
fs.mkdirSync('public/icons', { recursive: true });
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const p = await b.newPage({ viewport: { width: 1800, height: 1300 }, deviceScaleFactor: 2 });
await p.addInitScript(() => {
  sessionStorage.setItem('space-os:booted', '1');
  localStorage.setItem('space-os:perf', 'high');
});
await p.goto(BASE + '/icon-lab', { waitUntil: 'load', timeout: 120000 });
// Only the stages: the layout's star field, nav, cursor and ship would
// otherwise be behind every 'transparent' canvas.
await p.addStyleTag({ content: 'html, body { background: transparent !important; } body > *:not(#main) { display: none !important; } canvas { background: transparent !important; }' });
// Every stage reports data-ready once its shaders are warm; then a few frames.
await p.waitForFunction(() => [...document.querySelectorAll('[data-icon]')].every((e) => e.hasAttribute('data-ready')), null, { timeout: 120000 });
await p.waitForTimeout(2500);
for (const el of await p.$$('[data-icon]')) {
  const name = await el.getAttribute('data-icon');
  await el.screenshot({ path: `public/icons/${name}.png`, omitBackground: true });
  console.log('wrote public/icons/' + name + '.png');
}
await b.close();
