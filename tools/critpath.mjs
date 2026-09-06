// What actually stands between the request and the first pixel, on a throttled
// phone. FCP is now the whole story, so this is the only path that matters.
import { chromium, devices } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ ...devices['Pixel 5'] });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false, latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
});
await p.addInitScript(() => {
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__fcp = Math.round(e.startTime);
  }).observe({ type: 'paint', buffered: true });
});
await p.goto(BASE + '/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(6000);
const r = await p.evaluate(() => {
  const fcp = window.__fcp ?? 0;
  const nav = performance.getEntriesByType('navigation')[0];
  const before = performance.getEntriesByType('resource')
    .filter((x) => x.startTime < fcp)
    .map((x) => ({
      n: x.name.split('/').pop().slice(0, 34),
      type: x.initiatorType,
      start: Math.round(x.startTime),
      end: Math.round(x.responseEnd),
      kb: Math.round(x.transferSize / 1024),
    }))
    .sort((a, c) => c.end - a.end);
  return {
    fcp,
    html: { ttfb: Math.round(nav.responseStart), done: Math.round(nav.responseEnd), kb: Math.round(nav.transferSize / 1024) },
    before,
  };
});
console.log(`FCP ${r.fcp}ms`);
console.log(`HTML: ttfb ${r.html.ttfb}ms, fully received ${r.html.done}ms, ${r.html.kb}kb`);
console.log(`${r.before.length} resources finished before first paint — latest first:`);
for (const x of r.before.slice(0, 8)) {
  console.log(`   ${String(x.end).padStart(5)}ms end  ${String(x.kb).padStart(4)}kb  ${x.type.padEnd(6)} ${x.n}`);
}
await b.close();
