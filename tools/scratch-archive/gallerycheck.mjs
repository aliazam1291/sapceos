/*
 * Does the card gallery actually appear, animate, and respond to hover/click?
 *
 * Scrolls into the pinned section, waits for [data-pinned], then checks canvas
 * presence, GL context count, and that a click on the canvas centre changes
 * something observable (a `data-selected` article appearing).
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });

const top = await p.evaluate(() => document.getElementById('method').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + 400);
await p.waitForFunction(() => document.querySelector('[data-pinned]') !== null, null, { timeout: 8000 }).catch(() => console.log('NEVER PINNED'));
await p.waitForTimeout(2500);

const canvasCount = await p.evaluate(() => document.querySelectorAll('#method canvas').length);
console.log('canvases inside #method:', canvasCount);

const activeBefore = await p.evaluate(() => document.querySelector('#method article[data-on]')?.querySelector('h2')?.textContent);
console.log('active mission (scroll-driven):', activeBefore);

// Click roughly where the nearest card should render.
await p.mouse.click(720, 460);
await p.waitForTimeout(600);
const selected = await p.evaluate(() => document.querySelector('#method article[data-selected]')?.querySelector('h2')?.textContent);
console.log('selected after click:', selected ?? '(none — click may have missed the hit-plane)');

// sr-only nav present and operable?
const navButtons = await p.evaluate(() => document.querySelectorAll('#method nav[aria-label] button').length);
console.log('sr-only nav buttons:', navButtons);

await b.close();
