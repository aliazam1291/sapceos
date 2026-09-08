/*
 * Phase 4 verification: do the eight text-only routes now respond to a
 * cursor, and does the contact copy control actually reach the clipboard?
 *
 * The "no pointer-responsive element" finding was measured, so the fix gets
 * measured the same way rather than eyeballed: hover a row, read the computed
 * opacity of its ::before wash, and compare against resting state.
 *
 * NOTE ON SELECTORS. CSS Modules hashes class names, and `.rows` (the list
 * container) contains the substring "row" just as `.row` does — a
 * `[class*="row"]` selector matches the container first, which has no
 * ::before at all, so its opacity reads as the initial value 1 both before
 * and after hover and the check silently passes nothing. Rows are therefore
 * identified structurally, by having a `rowLabel` child.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const p = await ctx.newPage();

const wash = () => p.evaluate(() => {
  const label = document.querySelector('[class*="rowLabel"]');
  const row = label?.parentElement;
  if (!row) return null;
  const cs = getComputedStyle(row, '::before');
  return { opacity: cs.opacity, bar: getComputedStyle(row, '::after').transform };
});

for (const route of ['/about', '/contact', '/mission-history', '/missions/technician-app']) {
  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  const before = await wash();
  if (!before) { console.log(`${route.padEnd(26)} no row found`); continue; }

  const row = await p.evaluateHandle(() => document.querySelector('[class*="rowLabel"]')?.parentElement);
  await row.asElement()?.hover();
  await p.waitForTimeout(700);
  const after = await wash();

  const h1 = await p.evaluate(() => {
    const h = document.querySelector('h1');
    return h ? Math.round(parseFloat(getComputedStyle(h).fontSize)) : null;
  });

  const responds = before.opacity !== after.opacity || before.bar !== after.bar;
  console.log(
    `${route.padEnd(26)} wash ${before.opacity}->${after.opacity}  ` +
    `rule ${before.bar === after.bar ? 'static' : 'draws in'}  ` +
    `${responds ? 'RESPONDS' : 'NO CHANGE'}  h1 ${h1}px`,
  );
}

await p.goto(BASE + '/contact', { waitUntil: 'load' });
await p.waitForTimeout(1000);
const btn = await p.$('button[aria-label^="Copy"]');
if (!btn) {
  console.log('\ncopy control: NOT FOUND');
} else {
  await btn.click();
  await p.waitForTimeout(400);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  console.log(`\ncopy control: clipboard now "${clip}"`);
}

await b.close();
