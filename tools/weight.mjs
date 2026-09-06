// Where the JavaScript actually goes, per route, in production.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const route of ['/', '/about', '/contact']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const hits = [];
  p.on('response', async (r) => {
    const t = (r.headers()['content-type'] ?? '').split(';')[0];
    if (!t.includes('javascript')) return;
    // `request().sizes()` reports what actually crossed the wire. Reading
    // `content-length`, or falling back to `response.body()`, measures the
    // DECODED bytes — which for a gzipped 3D bundle overstates the real cost by
    // roughly 3x and turns an on-budget page into a fake emergency.
    const sz = await r.request().sizes().catch(() => null);
    const wire = sz?.responseBodySize ?? 0;
    const raw = (await r.body().catch(() => Buffer.alloc(0))).length;
    hits.push({ url: r.url().split('/').pop().slice(0, 52), n: wire || raw, raw });
  });
  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const atLoad = hits.length;
  await p.waitForFunction(() => document.querySelectorAll('canvas').length > 1, null, { timeout: 12000 }).catch(() => {});
  await p.waitForTimeout(4000);

  hits.sort((a, c) => c.n - a.n);
  const total = hits.reduce((s, h) => s + h.n, 0);
  console.log(`\n── ${route}   ${Math.round(total / 1024)}kb across ${hits.length} files (${atLoad} before 3D)`);
  for (const h of hits.slice(0, 8)) console.log(`   ${String(Math.round(h.n / 1024)).padStart(5)}kb  ${h.url}`);
  const rest = hits.slice(8).reduce((s, h) => s + h.n, 0);
  if (rest) console.log(`   ${String(Math.round(rest / 1024)).padStart(5)}kb  … ${hits.length - 8} more`);
  await p.close();
}
await b.close();
