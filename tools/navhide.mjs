/*
 * Does the nav dock actually get out of the way on scroll-down and come back
 * on scroll-up, without needing a huge scroll to trigger?
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'load' });
await p.waitForTimeout(1500);

const hiddenState = async () => p.evaluate(() => {
  const bar = document.querySelector('header[class*="bar"]');
  return bar ? bar.hasAttribute('data-hidden') : null;
});

console.log('at top:', await hiddenState());

// Scroll down in several ticks (a real wheel gesture, not one jump).
for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(80); }
await p.waitForTimeout(400);
console.log('after scrolling down ~1200px:', await hiddenState());
await p.screenshot({ path: 'tools/shots/nav-hidden.png' });

// Scroll up.
for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, -150); await p.waitForTimeout(80); }
await p.waitForTimeout(400);
console.log('after scrolling up:', await hiddenState());
await p.screenshot({ path: 'tools/shots/nav-revealed.png' });

// Scroll to the very bottom.
await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
await p.waitForTimeout(400);
console.log('at bottom of page:', await hiddenState());

await b.close();
