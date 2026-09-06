// Reduced-motion and mobile passes for the persistent star layer.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

// ── prefers-reduced-motion: a static frame, no loop, no pinning.
const rm = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errs = [];
rm.on('pageerror', (e) => errs.push(e.message));
await rm.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
// Wait for the canvas to have CONTENT, not merely to exist. The element is
// server-rendered, so `querySelector('canvas')` resolves instantly and a fixed
// sleep after it lands right on the moment the first frame is painted — which
// is why this check reported "not drawn" at random.
await rm
  .waitForFunction(
    () => {
      const c = document.querySelector('canvas');
      return c ? c.toDataURL('image/png').length > 20000 : false;
    },
    null,
    { timeout: 30000 },
  )
  .catch(() => {});
const grab = (pg) => pg.evaluate(() => {
  const c = document.querySelector('canvas');
  return c ? c.toDataURL('image/png').slice(3000, 3400) : null;
});
const r1 = await grab(rm);
await rm.waitForTimeout(1500);
const r2 = await grab(rm);
console.log('[reduced] canvas drawn :', r1 !== null && r1.length > 0);
console.log('[reduced] field static :', r1 === r2);
console.log('[reduced] pinned track :', await rm.evaluate(() => !!document.querySelector('[data-live]')));
console.log('[reduced] errors       :', errs.length ? errs : 'none');
await rm.screenshot({ path: 'tools/shots/M-reduced.png', timeout: 120000 });

// ── mobile.
const mob = await b.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const merrs = [];
mob.on('pageerror', (e) => merrs.push(e.message));
await mob.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await mob.waitForTimeout(3500);
console.log('[mobile]  errors       :', merrs.length ? merrs : 'none');
console.log('[mobile]  h scrollbar  :', await mob.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
await mob.screenshot({ path: 'tools/shots/M-mobile.png', timeout: 120000 });
await b.close();
