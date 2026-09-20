// Why is first paint late on a route? A CPU profile of the first N seconds
// after navigation, aggregated by function (self time), plus the observed
// paint timings and long tasks — so a slow hydration can be named.
//
//   node tools/profile-uat.mjs /missions      (BASE=http://localhost:3210)
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/missions';
// CHROME=1 drives the installed Chrome (real GPU, like Lighthouse) instead of
// Playwright's SwiftShader build; SECONDS sets the profile window.
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const SECONDS = +(process.env.SECONDS ?? 3.5);
const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
await p.addInitScript(() => {
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push({ start: Math.round(e.startTime), dur: Math.round(e.duration), name: e.attribution?.[0]?.containerSrc || e.attribution?.[0]?.name }))).observe({ type: 'longtask', buffered: true });
});
const cdp = await ctx.newCDPSession(p);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
await cdp.send('Profiler.start');
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
// SCROLL=1: after 2.5s, scroll the whole page at reading pace inside the window.
if (process.env.SCROLL) {
  await p.waitForTimeout(2500);
  await p.evaluate((secs) => new Promise((res) => { const H = document.documentElement.scrollHeight - innerHeight; const t0 = performance.now(); const dur = Math.max(2000, (secs - 3) * 1000); const f = (now) => { const k = Math.min(1, (now - t0) / dur); window.scrollTo(0, H * k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }), SECONDS);
} else await p.waitForTimeout(SECONDS * 1000);
const { profile } = await cdp.send('Profiler.stop');
const paints = await p.evaluate(() => performance.getEntriesByType('paint').map((e) => `${e.name} ${Math.round(e.startTime)}ms`));
const longs = await p.evaluate(() => window.__long);
console.log('paint:', paints.join(' · '));
console.log('long tasks:', longs.map((l) => `${l.start}+${l.dur}ms ${String(l.name ?? '').split('/').pop()}`).join(' | '));
console.log('booting now:', await p.evaluate(() => document.documentElement.hasAttribute('data-booting')), '| canvases:', await p.evaluate(() => document.querySelectorAll('canvas').length));

// Self time per function, from the samples.
const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dts = profile.timeDeltas;
for (let i = 0; i < profile.samples.length; i++) {
  const n = nodes.get(profile.samples[i]);
  const cf = n.callFrame;
  const key = `${cf.functionName || '(anon)'} @ ${cf.url.split('/').pop().slice(0, 22)}:${cf.lineNumber}:${cf.columnNumber}`;
  self.set(key, (self.get(key) ?? 0) + (dts[i] ?? 0) / 1000);
}
const top = [...self.entries()].filter(([k]) => !/\(program\)|\(idle\)|\(garbage/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 18);
console.log('\ntop self time (ms):');
for (const [k, ms] of top) console.log(String(Math.round(ms)).padStart(6), k);
await b.close();
