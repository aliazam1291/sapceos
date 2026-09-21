// What does a real visitor's LCP / CLS / INP look like on a route, through
// the launch screen (first visit) and without it (return visit)? Records
// every largest-contentful-paint candidate with its element and time — the
// LAST one before the first interaction is what Speed Insights reports — plus
// layout shifts, on real Chrome (CHROME=1) with mobile emulation by default.
//
//   CHROME=1 node tools/vitals-uat.mjs /
//   CHROME=1 DESKTOP=1 node tools/vitals-uat.mjs /
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});

for (const booted of [false, true]) {
  const ctx = await b.newContext(process.env.DESKTOP ? { viewport: { width: 1440, height: 900 } } : { viewport: { width: 412, height: 823 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.addInitScript((booted) => {
    if (booted) sessionStorage.setItem('space-os:booted', '1');
    window.__lcp = [];
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const el = e.element;
        window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: el ? `${el.tagName.toLowerCase()}.${(el.className || '').toString().replace(/\S+__/g, '').split(' ')[0]}` : e.url || '?', text: (el?.textContent || '').trim().slice(0, 40) });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  }, booted);
  await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
  // Long enough for the launch window (T−05) to auto-launch and the page to settle.
  await p.waitForTimeout(booted ? 6000 : 14000);
  const lcp = await p.evaluate(() => window.__lcp);
  const cls = await p.evaluate(() => window.__cls);
  const fcp = await p.evaluate(() => Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0));
  console.log(`\n${route} — ${booted ? 'return visit (no launch screen)' : 'first visit (launch screen)'}: FCP ${fcp}ms · CLS ${cls.toFixed(3)} · LCP candidates:`);
  for (const e of lcp) console.log(`   ${String(e.t).padStart(6)}ms  ${String(e.size).padStart(7)}px²  ${e.el}  “${e.text}”`);
  console.log(`   → reported LCP would be ${lcp.at(-1)?.t ?? '?'}ms`);
  await ctx.close();
}
await b.close();
