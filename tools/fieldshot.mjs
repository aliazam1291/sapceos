/*
 * Isolates the DeepSpace field for before/after comparison.
 *
 * Uses reducedMotion so the component takes its static-frame branch: one draw
 * at camZ = 0 with a fixed seed, which makes two runs pixel-comparable. Under
 * the animated branch camZ advances with wall-clock time, so no two shots ever
 * match and a real regression is impossible to distinguish from timing.
 *
 * Everything except the field is hidden, because the glows are faint by design
 * and are otherwise judged through a layer of body copy.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const out = process.argv[2] ?? 'tools/shots/field.png';

const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForTimeout(3000);

await p.evaluate(() => {
  for (const el of document.body.children) {
    if (!el.querySelector?.('canvas') || !el.className?.toString().match(/deepSpace/i)) {
      el.style.display = 'none';
    }
  }
  const f = document.querySelector('[class*=deepSpace]');
  if (f) { f.style.display = ''; f.closest('body') && (document.body.style.background = '#050505'); }
});
await p.waitForTimeout(500);
await p.screenshot({ path: out });
console.log('wrote', out);
await b.close();
