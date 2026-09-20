// Is the site actually usable on a phone? Every route at 375×812 (and 320
// wide for the narrowest common phone): can the reader scroll sideways
// (they must not), which elements poke past the right edge, is any text
// below 12px, are tap targets under 40px, and a screenshot of the top and
// of a mid-page position for the eye.
//
//   node tools/mobile-uat.mjs            (dev server on :3000)
//   BASE=http://localhost:3210 node tools/mobile-uat.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const routes = (process.env.ROUTES ?? '/,/missions,/missions/vahan-shakti,/field-notes,/field-notes/linear-vs-jira,/lab,/decisions,/about,/mission-history,/contact').split(',');
const sizes = (process.env.SIZES ?? '375x812,320x720').split(',').map((x) => x.split('x').map(Number));
fs.mkdirSync('tools/shots/mobile', { recursive: true });

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const rows = [];
for (const [w, h] of sizes) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
  for (const route of routes) {
    try {
      await p.goto(BASE + route, { waitUntil: 'load', timeout: 60000 });
    } catch (e) {
      rows.push({ w, route, panX: 'load failed', overflow: String(e.message).slice(0, 40) });
      continue;
    }
    await p.waitForTimeout(2200);
    const r = await p.evaluate(() => {
      const doc = document.documentElement;
      // Can the user actually pan sideways?
      window.scrollTo(9999, 0);
      const panned = window.scrollX > 0;
      window.scrollTo(0, 0);
      // What pokes past the right edge (visible elements only)?
      const over = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > innerWidth + 2 && r.left < innerWidth) {
          // Skip descendants of an already-listed offender and anything clipped by an ancestor.
          let clipped = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const o = getComputedStyle(a).overflowX;
            if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') { clipped = true; break; }
          }
          if (!clipped) over.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0].slice(0, 36)} +${Math.round(r.right - innerWidth)}px`);
        }
        if (over.length > 6) break;
      }
      // Tiny text and small tap targets.
      let tiny = 0;
      const tinyEx = [];
      for (const el of document.querySelectorAll('p, span, a, li, dt, dd, h1, h2, h3, button, label')) {
        const cs = getComputedStyle(el);
        if (!el.textContent.trim() || cs.visibility === 'hidden') continue;
        const fs = parseFloat(cs.fontSize);
        if (fs < 11 && el.getBoundingClientRect().height > 0) { tiny++; if (tinyEx.length < 3) tinyEx.push(`${el.tagName.toLowerCase()} ${fs}px "${el.textContent.trim().slice(0, 18)}"`); }
      }
      let smallTaps = 0;
      const tapEx = [];
      for (const el of document.querySelectorAll('a, button')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 36 && r.width < 36) { smallTaps++; if (tapEx.length < 3) tapEx.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}×${Math.round(r.height)} "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 16)}"`); }
      }
      return { panned, scrollWidth: doc.scrollWidth, over, tiny, tinyEx, smallTaps, tapEx, height: doc.scrollHeight };
    });
    const row = { w, route, panX: r.panned ? 'YES' : 'no', overflow: r.over.length ? r.over.slice(0, 3).join(' | ') : '—', tiny: r.tiny, smallTaps: r.smallTaps };
    rows.push(row);
    console.log(JSON.stringify(row));
    if (r.tiny) console.log(`  ${w} ${route} tiny text:`, r.tinyEx.join(' ; '));
    if (r.smallTaps) console.log(`  ${w} ${route} small taps:`, r.tapEx.join(' ; '));
    const tag = `${w}-${route.replace(/\//g, '_') || '_root'}`;
    await p.screenshot({ path: `tools/shots/mobile/${tag}-top.png` });
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(r.height * 0.45));
    await p.waitForTimeout(1800);
    await p.screenshot({ path: `tools/shots/mobile/${tag}-mid.png` });
  }
  await p.close();
}
await b.close();
console.table(rows);
