// Every route, loaded and scrolled to the bottom in a real browser: page
// errors, console errors and failed requests. A site with this much client
// code should be silent.
//
//   node tools/console-uat.mjs        (BASE=http://localhost:3210)
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
const routes = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
const issues = [];
let route = '';
p.on('pageerror', (e) => issues.push(`${route}: pageerror ${e.message.slice(0, 120)}`));
p.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    const t = m.text();
    // Three's own "WebGL context" chatter under SwiftShader is not ours.
    if (/GPU stall|SwiftShader|Automatic fallback to software WebGL/i.test(t)) return;
    issues.push(`${route}: console.${m.type()} ${t.slice(0, 140)}`);
  }
});
p.on('requestfailed', (r) => issues.push(`${route}: request failed ${r.url().slice(-60)} ${r.failure()?.errorText ?? ''}`));
p.on('response', (r) => {
  if (r.status() >= 400) issues.push(`${route}: HTTP ${r.status()} ${r.url().slice(-70)}`);
});
for (route of routes) {
  await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(1500);
  // Scroll through, so lazy chunks, scenes and reveals all run.
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(140);
  }
  await p.waitForTimeout(1200);
}
// The palette and the nav overlay, once.
await p.goto(BASE + '/missions', { waitUntil: 'load' });
await p.keyboard.press('Control+K');
await p.waitForTimeout(400);
await p.keyboard.type('vah');
await p.keyboard.press('Enter');
await p.waitForTimeout(1500);
route = '/missions → palette → vahan';
console.log('landed on', p.url());
await b.close();
console.log(`${routes.length} routes`);
if (issues.length) {
  console.log(`${issues.length} issues:`);
  for (const i of [...new Set(issues)]) console.log('  -', i);
} else console.log('silent');
