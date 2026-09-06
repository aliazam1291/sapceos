// Where the main thread actually goes. Long tasks with durations and the
// script that owns them, rather than a bare count.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const route of ['/', '/missions', '/contact']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => {
    window.__tasks = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__tasks.push({
          d: Math.round(e.duration),
          t: Math.round(e.startTime),
          src: (e.attribution?.[0]?.containerSrc || e.attribution?.[0]?.name || 'unknown').split('/').pop(),
        });
      }
    }).observe({ type: 'longtask', buffered: true });
  });
  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.waitForTimeout(14000);
  const t = await p.evaluate(() => window.__tasks);
  const total = t.reduce((s, x) => s + x.d, 0);
  const worst = [...t].sort((a, c) => c.d - a.d).slice(0, 4);
  // Split mount cost from ongoing cost. Creating a GL context and compiling
  // shaders is a one-off; a loop that keeps blocking is a defect.
  const afterSettle = t.filter((x) => x.t > 9000);
  console.log(`\n── ${route}`);
  console.log(`   ${t.length} long tasks, ${total}ms blocked total`);
  console.log(`   worst: ${worst.map((w) => `${w.d}ms@${w.t}`).join(', ')}`);
  console.log(`   after 9s (steady state): ${afterSettle.length} tasks, ${afterSettle.reduce((s, x) => s + x.d, 0)}ms`);
  await p.close();
}
await b.close();
