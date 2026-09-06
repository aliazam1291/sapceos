/*
 * Camera rake check.
 *
 * Shoots the hero galaxy at several scroll depths so the change in VIEWING
 * ANGLE can be judged, not just described. The rig used to only dolly along a
 * fixed line, which is invisible in a single screenshot and equally invisible
 * in a description — the only honest way to check the fix is a strip of frames
 * from the same scene at different scroll positions, side by side.
 *
 * Usage: BASE=http://localhost:3210 node tools/camrake.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const STOPS = [0, 0.28, 0.55];

const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
// The canvas is gated behind idle/intersection, and the rig damps toward its
// target rather than snapping, so both need time before any frame is truthful.
await p.waitForTimeout(4000);

for (const s of STOPS) {
  await p.evaluate((frac) => window.scrollTo(0, window.innerHeight * frac), s);
  // Long enough for the damped scrollT to settle at the new target.
  await p.waitForTimeout(2500);
  const name = `tools/shots/rake-${String(s).replace('.', '')}.png`;
  await p.screenshot({ path: name, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  console.log('wrote', name);
}

await b.close();
