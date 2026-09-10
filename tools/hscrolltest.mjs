/*
 * Can a user ACTUALLY scroll sideways?
 *
 * `documentElement.scrollWidth > clientWidth` is the usual proxy and it is a
 * bad one here: `body { overflow-x: hidden }` clips the overflow, so
 * scrollWidth keeps reporting the content extent while the page is not
 * horizontally scrollable at all. Reporting that as a bug sends you hunting
 * for an offender that no reader can ever see.
 *
 * This asks the user-facing question instead: try to scroll right, on the
 * document and on body, and see whether anything moves. Also drags a touch
 * gesture, since touch panning and programmatic scrolling can differ.
 */
import { chromium, devices } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();

for (const [w, h] of [[320, 720], [375, 812], [768, 1024]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForTimeout(2200);

  const r = await p.evaluate(() => {
    const doc = document.documentElement;
    const before = { x: window.scrollX, docL: doc.scrollLeft, bodyL: document.body.scrollLeft };
    window.scrollTo(9999, window.scrollY);
    doc.scrollLeft = 9999;
    document.body.scrollLeft = 9999;
    const after = { x: window.scrollX, docL: doc.scrollLeft, bodyL: document.body.scrollLeft };
    window.scrollTo(0, window.scrollY); doc.scrollLeft = 0; document.body.scrollLeft = 0;
    return {
      clientW: doc.clientWidth,
      scrollW: doc.scrollWidth,
      reportedOverflow: doc.scrollWidth - doc.clientWidth,
      movedPx: Math.max(after.x - before.x, after.docL - before.docL, after.bodyL - before.bodyL),
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      htmlOverflowX: getComputedStyle(doc).overflowX,
    };
  });

  const verdict = r.movedPx > 0 ? `*** SCROLLS ${r.movedPx}px ***` : 'cannot scroll (clipped)';
  console.log(
    `${(w + 'x' + h).padEnd(10)} scrollWidth reports +${String(r.reportedOverflow).padStart(2)}px  ` +
    `${verdict.padEnd(26)} body:${r.bodyOverflowX} html:${r.htmlOverflowX}`,
  );
  await p.close();
}
await b.close();
