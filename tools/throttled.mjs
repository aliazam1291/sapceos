// The measurement DESIGN_DIRECTION.md actually asks for and nobody had taken:
// what this feels like on a mid-range phone rather than on a dev machine.
//
// 4x CPU slowdown + Fast 3G, which is roughly a mid-tier Android on mobile data.
import { chromium, devices } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const route of ['/', '/missions', '/contact']) {
  const ctx = await b.newContext({ ...devices['Pixel 5'] });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });

  await p.addInitScript(() => {
    window.__m = {};
    window.__m.lcpTrail = [];
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1);
      window.__m.lcp = Math.round(e.startTime);
      window.__m.lcpEl = `${e.element?.tagName ?? '?'}.${(e.element?.className ?? '').toString().split(' ')[0].slice(0, 28)}`;
      window.__m.lcpTrail.push(`${Math.round(e.startTime)}ms ${e.element?.tagName ?? '?'}`);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = Math.round(e.startTime);
    }).observe({ type: 'paint', buffered: true });
    window.__m.blocked = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__m.blocked += Math.max(0, e.duration - 50);
    }).observe({ type: 'longtask', buffered: true });
  });

  await p.goto(BASE + route, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(9000);
  const m = await p.evaluate(() => window.__m);
  const verdict = (m.lcp ?? 9999) < 2500 ? 'good' : (m.lcp ?? 9999) < 4000 ? 'needs work' : 'POOR';
  console.log(
    `${route.padEnd(11)} FCP ${String(m.fcp ?? '?').padStart(5)}ms   LCP ${String(m.lcp ?? '?').padStart(5)}ms  (${verdict})   TBT ${Math.round(m.blocked)}ms`,
  );
  console.log(`            LCP element ${m.lcpEl}   trail: ${(m.lcpTrail ?? []).join(' → ')}`);
  await ctx.close();
}
await b.close();
