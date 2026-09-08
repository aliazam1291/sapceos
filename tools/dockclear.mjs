/*
 * Is any content actually trapped under the docked bar at rest?
 *
 * The footer already reserves clearance (globals.scss), and the dock now
 * auto-hides on scroll — so the only real risk is a page short enough that
 * there is nothing to scroll, where neither mitigation applies. Checks each
 * route for content whose box overlaps the dock while the page sits at rest.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });

for (const route of ['/contact', '/orbit', '/lab', '/field-notes', '/about']) {
  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const dock = document.querySelector('header[class*="bar"] [class*="dock"]');
    if (!dock) return { scrollable, trapped: 'no dock' };
    const d = dock.getBoundingClientRect();
    // Anything with text whose box intersects the dock's band right now.
    const hits = [...document.querySelectorAll('main a, main dd, main p, main h2')]
      .filter((el) => {
        const e = el.getBoundingClientRect();
        return e.height > 0 && e.bottom > d.top && e.top < d.bottom;
      })
      .map((el) => (el.textContent || '').trim().slice(0, 34));
    return { scrollable, hits };
  });
  console.log(
    `${route.padEnd(14)} scrollable ${String(r.scrollable).padStart(5)}px  ` +
    `under dock at rest: ${r.hits?.length ? r.hits.join(' | ') : 'nothing'}`,
  );
}
await b.close();
