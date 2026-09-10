/*
 * The small-viewport counterpart to bigscreen.mjs.
 *
 * bigscreen only tests 1440 and up, and its `hScroll` check is neutered by
 * `body { overflow-x: hidden }` in globals.scss — that rule CLIPS overflow
 * rather than preventing it, so a scrollbar never appears and the check
 * always passes. This measures `documentElement.scrollWidth` directly, which
 * still reports the real content extent, and names the elements responsible.
 *
 * It also checks whether the headline is genuinely clipped, by comparing
 * scrollWidth against the rendered box rather than measuring unwrapped text
 * with a nowrap probe — the probe answers "how wide would this be on one
 * line", which is NOT the same question and produced one false alarm here.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const ROUTES = (process.env.ROUTES ?? '/').split(',');

const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const route of ROUTES) {
  for (const [w, h] of [[320, 720], [375, 812], [414, 896], [768, 1024], [1024, 768]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.goto(BASE + route, { waitUntil: 'load' });
    await p.waitForTimeout(2500);

    const r = await p.evaluate(() => {
      const doc = document.documentElement;
      const over = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          return b.height > 0 && b.width > 0 && (b.right > doc.clientWidth + 1 || b.left < -1);
        })
        .map((el) => ({
          cls: (el.className || '').toString().split('-')[0] || el.tagName,
          w: Math.round(el.getBoundingClientRect().width),
          right: Math.round(el.getBoundingClientRect().right),
          pos: getComputedStyle(el).position,
        }));
      // Dedupe by class, keep the widest offender per component.
      const worst = new Map();
      for (const o of over) if (!worst.has(o.cls) || worst.get(o.cls).w < o.w) worst.set(o.cls, o);

      // Is any heading actually cut off? scrollWidth vs the rendered box.
      const clipped = [...document.querySelectorAll('h1, h2')]
        .filter((el) => el.scrollWidth > Math.ceil(el.getBoundingClientRect().width) + 1)
        .map((el) => (el.textContent || '').trim().slice(0, 28));

      return {
        clientW: doc.clientWidth,
        scrollW: doc.scrollWidth,
        overflowPx: doc.scrollWidth - doc.clientWidth,
        offenders: [...worst.values()].sort((a, c) => c.w - a.w).slice(0, 4),
        clippedHeadings: clipped,
      };
    });

    const flag = r.overflowPx > 0 ? `OVERFLOW +${r.overflowPx}px` : 'ok';
    console.log(
      `${(route + ' ' + w + 'x' + h).padEnd(22)} ${flag.padEnd(16)}` +
      `${r.clippedHeadings.length ? 'CLIPPED: ' + r.clippedHeadings.join(' | ') : 'headings ok'}`,
    );
    if (r.offenders.length) {
      for (const o of r.offenders) console.log(`      ${o.cls.padEnd(14)} w=${String(o.w).padStart(5)} right=${String(o.right).padStart(5)} ${o.pos}`);
    }
    await p.close();
  }
}
await b.close();
