// Can the 3D be reached without a mouse, and what is a screen reader told?
//
// The hero galaxy is the site's centrepiece and its fifteen nodes were pure
// pointer targets. This tabs through the page and reports where focus lands,
// plus the accessible name of every canvas.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 2, null, { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3500);

console.log('canvases and what assistive tech is told:');
for (const c of await p.evaluate(() =>
  [...document.querySelectorAll('canvas')].map((c) => {
    const l = c.closest('[role="img"],[aria-label],[aria-hidden]');
    return {
      own: c.getAttribute('aria-label') || c.getAttribute('role') || null,
      viaAncestor: l ? (l.getAttribute('aria-label') || (l.getAttribute('aria-hidden') && 'hidden')) : null,
    };
  }))) console.log('  ', JSON.stringify(c));

const seen = [];
await p.evaluate(() => document.body.focus());
for (let i = 0; i < 34; i++) {
  await p.keyboard.press('Tab');
  seen.push(await p.evaluate(() => {
    const a = document.activeElement;
    if (!a) return 'none';
    const inGalaxy = !!a.closest('nav[aria-label="Star map systems"]');
    const name = (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 34).replace(/\s+/g, ' ');
    return `${a.tagName}:${name}${inGalaxy ? '   <- galaxy' : ''}`;
  }));
}
console.log('');
console.log('tab stops from the top of the page:');
seen.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s}`));
const n = seen.filter((x) => x.includes('<- galaxy')).length;
console.log('');
console.log(`tab stops inside the star map: ${n}`);

// Focusing a node should fly the camera and open its panel, exactly as a click does.
if (n) {
  const opened = await p.evaluate(() => !!document.querySelector('[class*="drawer"],[class*="Drawer"]'));
  console.log(`detail panel open while a node has focus: ${opened}`);
}
await b.close();
