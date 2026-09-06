// Does the tallest beat clear the flight plan below it, at every beat and size?
// Scroll distance below is STOPS(10) * STOP_SCROLL(0.30) — update both if
// src/lib/sequence.ts changes, or this scrolls to the wrong offsets and
// reports layout failures that are not real.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w, h] of [[1440, 900], [1807, 851], [2560, 1440], [3440, 1440], [3840, 2160], [1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  // Settle scales with pixel count: 4K under software rendering needs several
  // times longer than 1440p, and a fixed wait reported "never pinned" there —
  // a harness failure that looked exactly like a layout bug.
  await p.waitForTimeout(2800 + Math.round((w * h) / 900000) * 1200);
  const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);
  const bad = [];
  for (const [i, f] of [0.08, 0.28, 0.48, 0.68, 0.9].entries()) {
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + 10 * 0.30 * h * f);
    await p.waitForTimeout(1200);
    /*
     * Measure only while the screen is actually pinned.
     *
     * The band and flight plan are positioned against a 100vh screen that GSAP
     * only aligns to the viewport once the pin engages. Before that the same
     * boxes sit wherever the section happens to be scrolled to, and reading
     * them reports a "cut off" that is not real.
     */
    const isPinned = await p
      .waitForFunction(() => document.querySelector('[data-pinned]') !== null, null, { timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    if (!isPinned) { bad.push(`beat ${i + 1} never pinned`); continue; }
    const r = await p.evaluate(() => {
      const beat = [...document.querySelectorAll('article')].find((e) => e.hasAttribute('data-on'));
      const plan = document.querySelector('ol[class*="itinerary"]');
      if (!beat || !plan) return null;
      // Every child, not just the last one — the band lays out ACROSS now, so
      // the lowest element is not necessarily the last in source order.
      // Every child, not just the last: the band lays out ACROSS, so the
      // lowest element is not necessarily last in source order.
      const boxes = [...beat.children].map((c) => c.getBoundingClientRect());
      const low = Math.max(...boxes.map((b) => b.bottom));
      const high = Math.min(...boxes.map((b) => b.top));
      const pr = plan.getBoundingClientRect();
      return {
        gap: Math.round(pr.top - low),
        // Cut off at either edge is a failure too — the previous check only
        // looked at the gap to the flight plan and happily passed a band whose
        // premise ran off the bottom of the screen.
        cutBottom: Math.round(low - innerHeight),
        cutTop: Math.round(-high),
      };
    });
    if (!r) continue;
    if (r.gap < 8) bad.push(`beat ${i + 1} overlaps plan by ${-r.gap}px`);
    if (r.cutBottom > 0) bad.push(`beat ${i + 1} cut off ${r.cutBottom}px below the fold`);
    if (r.cutTop > 0) bad.push(`beat ${i + 1} cut off ${r.cutTop}px above the fold`);
  }
  console.log(`${w}x${h}: ${bad.length ? 'FAIL — ' + bad.join('; ') : 'all beats fit, clear of the plan'}`);
  await p.close();
}
await b.close();
