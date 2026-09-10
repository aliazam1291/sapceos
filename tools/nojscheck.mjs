/*
 * With scripting genuinely OFF, is the content actually VISIBLE?
 *
 * Not "is it in the HTML" — that is the weaker question, and answering it is
 * how a progressive-enhancement bug ships. Text can be present in the served
 * markup and still be `display: none` because a CSS rule keyed on an
 * attribute that was server-rendered is doing the hiding. This renders with
 * JS disabled and reads computed styles.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();

for (const [route, sel, label] of [
  ['/about', '[id^="loop-"]', 'CareerLoop stage bodies'],
  ['/', '[data-reveal]', 'home reveal blocks'],
  ['/missions', '[class*="row"]', 'mission rows'],
]) {
  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.waitForTimeout(700);
  const r = await p.evaluate((s) => {
    const els = [...document.querySelectorAll(s)];
    let hidden = 0, visible = 0, words = 0;
    for (const el of els) {
      const cs = getComputedStyle(el);
      const invisible = cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05;
      if (invisible) hidden++; else { visible++; words += (el.textContent || '').trim().split(/\s+/).filter(Boolean).length; }
    }
    return { total: els.length, hidden, visible, words };
  }, sel);
  const verdict = r.hidden > 0 ? `*** ${r.hidden} HIDDEN ***` : 'all visible';
  console.log(`${route.padEnd(11)} ${label.padEnd(24)} ${String(r.total).padStart(3)} found  ${String(r.visible).padStart(3)} visible  ${verdict}  (${r.words} readable words)`);
}
await b.close();
