/*
 * Is smooth scrolling actually running?
 *
 * `src/lib/lenis.ts` shipped for a long time with `setLenis` never called, so
 * the handle was null, `lockScroll()` did nothing and every `scrollToId()` fell
 * through to native `scrollIntoView` — while globals.scss asserted the opposite.
 * "Lenis is imported" is not evidence; this checks the observable behaviour.
 *
 * Native scrolling lands a wheel tick in ONE frame. An interpolated scroll
 * spreads it over many. Counting the frames in which scrollY is still changing
 * after a single tick separates them without needing to reach into the page.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';

const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const reduced of [false, true]) {
  const p = await b.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForTimeout(4000);

  const cls = await p.evaluate(() => document.documentElement.className);

  await p.evaluate(() => {
    window.__y = [];
    const tick = () => { window.__y.push(window.scrollY); window.__r = requestAnimationFrame(tick); };
    window.__r = requestAnimationFrame(tick);
  });
  await p.mouse.move(720, 450);
  await p.mouse.wheel(0, 400);
  await p.waitForTimeout(1200);

  const ys = await p.evaluate(() => { cancelAnimationFrame(window.__r); return window.__y; });
  let moving = 0;
  for (let i = 1; i < ys.length; i++) if (Math.abs(ys[i] - ys[i - 1]) > 0.5) moving++;

  console.log(
    `reduced-motion:${String(reduced).padEnd(5)}  frames-with-movement:${String(moving).padStart(3)}  ` +
    `final scrollY:${String(Math.round(ys[ys.length - 1] || 0)).padStart(5)}  ` +
    `html class:"${cls.includes('lenis') ? cls.split(' ').filter(c => c.includes('lenis')).join(' ') : '(no lenis class)'}"`,
  );
  await p.close();
}

console.log('\nnative scroll settles in ~1-2 frames; interpolated scroll moves for many.');
await b.close();
