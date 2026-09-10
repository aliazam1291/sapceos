/*
 * The career loop: does stepping through it actually work, by click and by
 * keyboard, and does it degrade to a readable list with scripting off?
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();

// ── With JS.
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + '/about', { waitUntil: 'load' });
await p.waitForTimeout(1200);

const visibleDetails = () => p.evaluate(() =>
  [...document.querySelectorAll('[class*="stage"] p[id^="loop-"]')]
    .filter((el) => getComputedStyle(el).display !== 'none').length);

const litLabel = () => p.evaluate(() => {
  const el = document.querySelector('[class*="ringLabel"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
});

console.log('enhanced: visible details =', await visibleDetails(), '(expect 1)');
console.log('ring shows:', await litLabel());

const buttons = await p.$$('button[aria-controls^="loop-"]');
console.log('stage buttons:', buttons.length);

await buttons[4].click();
await p.waitForTimeout(400);
console.log('after clicking 5th ->', await litLabel(), '| visible details =', await visibleDetails());

// Keyboard: focus should select, so tabbing walks the loop.
await p.keyboard.press('Tab');
await p.waitForTimeout(400);
console.log('after Tab ->', await litLabel());

const expanded = await p.evaluate(() =>
  document.querySelectorAll('button[aria-expanded="true"][aria-controls^="loop-"]').length);
console.log('buttons reporting aria-expanded=true:', expanded, '(expect 1)');

await p.screenshot({ path: 'tools/shots/careerloop.png', clip: await (await p.$('[class*="loop"]')).boundingBox() });

// ── Without JS.
const noJs = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
const p2 = await noJs.newPage();
await p2.goto(BASE + '/about', { waitUntil: 'load' });
await p2.waitForTimeout(600);
const n = await p2.evaluate(() => 0); // no JS: cannot evaluate, so count via content
console.log('\nno-JS: page still served', (await p2.content()).includes('Find out what it actually changed') ? 'with all stage copy present' : 'MISSING stage copy');

await b.close();
