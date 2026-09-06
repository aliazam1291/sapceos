/*
 * Proves the node hit targets still work after their material was made
 * invisible. Raycasting and rendering are gated by different flags, so this is
 * exactly the change that could silently make the whole map unclickable while
 * still looking perfect in a screenshot.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);

// Sweep a grid across the map half of the hero and report where the canvas
// reports a hit, via the cursor the node handler sets.
let hits = 0;
for (let x = 620; x <= 1240; x += 40) {
  for (let y = 180; y <= 620; y += 40) {
    await p.mouse.move(x, y);
    const cur = await p.evaluate(() => document.body.style.cursor);
    if (cur === 'pointer') hits++;
  }
}
console.log('pointer-cursor hits across the map grid:', hits);
console.log(hits > 0 ? 'PASS — nodes are still raycastable' : 'FAIL — nothing is hittable');
await b.close();
