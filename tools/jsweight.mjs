/*
 * How much JavaScript does each route actually transfer?
 *
 * Row became a client component to gain its pointer response, which pushes a
 * client boundary onto eight previously all-server routes. That is exactly
 * the kind of change that is cheap in isolation and expensive in aggregate,
 * so it gets measured rather than assumed.
 *
 * Uses request().sizes().responseBodySize -- the ENCODED size actually sent.
 * `content-length` and response.body() report decoded bytes, which for a
 * gzipped bundle overstates the real cost by roughly 3x.
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const b = await chromium.launch();

for (const route of ['/', '/about', '/contact', '/lab', '/mission-history', '/field-notes']) {
  const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
  let js = 0;
  let n = 0;
  p.on('requestfinished', async (req) => {
    if (req.resourceType() !== 'script') return;
    try {
      const s = await req.sizes();
      js += s.responseBodySize || 0;
      n++;
    } catch {}
  });
  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  console.log(`${route.padEnd(18)} ${String(n).padStart(3)} scripts   ${(js / 1024).toFixed(1).padStart(7)} KB transferred`);
  await p.close();
}
console.log('\nDESIGN_DIRECTION budget: under ~500 KB after all 3D has mounted.');
await b.close();
