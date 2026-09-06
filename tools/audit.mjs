// Production audit. Runs against `next start`, not the dev server — dev numbers
// for bundle weight and LCP are meaningless.
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const routes = (process.argv[2] ?? '/,/missions,/about,/contact,/mission-history').split(',');

for (const route of routes) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

  const bytes = { js: 0, css: 0, font: 0, img: 0, other: 0 };
  p.on('response', async (r) => {
    try {
      const h = r.headers();
      const t = (h['content-type'] ?? '').split(';')[0];
      // WIRE bytes. `content-length` and `response.body()` both report decoded
      // size, which overstates a gzipped 3D bundle roughly 3x — enough to turn
      // an on-budget page into a false alarm.
      const sz = await r.request().sizes().catch(() => null);
      const n = sz?.responseBodySize || (await r.body().catch(() => Buffer.alloc(0))).length;
      if (t.includes('javascript')) bytes.js += n;
      else if (t.includes('css')) bytes.css += n;
      else if (t.includes('font')) bytes.font += n;
      else if (t.startsWith('image/')) bytes.img += n;
      else bytes.other += n;
    } catch {}
  });

  await p.addInitScript(() => {
    window.__lcp = null;
    window.__cls = 0;
    window.__long = 0;
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1);
      window.__lcp = { t: Math.round(e.startTime), tag: e.element?.tagName ?? '?', text: (e.element?.innerText ?? '').slice(0, 46) };
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { window.__long += l.getEntries().length; })
      .observe({ type: 'longtask', buffered: true });
  });

  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const jsAtLoad = bytes.js;
  // The budget in DESIGN_DIRECTION.md is stated "after all 3D has mounted", so
  // wait for the deferred scenes before reading the transfer figure again.
  await p
    .waitForFunction(() => document.querySelectorAll('canvas').length > 1, null, { timeout: 12000 })
    .catch(() => {});
  await p.waitForTimeout(4000);

  const m = await p.evaluate(() => ({
    lcp: window.__lcp,
    cls: +window.__cls.toFixed(4),
    long: window.__long,
    canvases: document.querySelectorAll('canvas').length,
    h1: [...document.querySelectorAll('h1')].map((h) => h.innerText.slice(0, 40)),
    headingJumps: (() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
      let bad = 0;
      for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) bad++;
      return bad;
    })(),
    imgNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    linkNoText: [...document.querySelectorAll('a,button')].filter(
      (e) => !e.innerText.trim() && !e.getAttribute('aria-label') && !e.getAttribute('title'),
    ).length,
    focusable: document.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])').length,
    docHeight: Math.round(document.documentElement.scrollHeight / window.innerHeight * 10) / 10,
  }));

  const kb = (n) => Math.round(n / 1024);
  console.log(`\n── ${route}`);
  console.log(`   LCP        ${m.lcp ? `${m.lcp.t}ms  <${m.lcp.tag}> "${m.lcp.text}"` : 'none'}`);
  console.log(`   CLS        ${m.cls}${m.cls > 0.1 ? '   ⚠ over 0.1' : ''}`);
  console.log(`   long tasks ${m.long}`);
  console.log(`   transfer   js ${kb(jsAtLoad)}kb at load → ${kb(bytes.js)}kb after 3D${bytes.js > 500 * 1024 ? '   ⚠ over the 500kb budget' : ''}`);
  console.log(`              css ${kb(bytes.css)}kb · font ${kb(bytes.font)}kb · img ${kb(bytes.img)}kb`);
  console.log(`   canvases   ${m.canvases}`);
  console.log(`   page len   ${m.docHeight} screens`);
  console.log(`   h1         ${m.h1.length === 1 ? `ok — "${m.h1[0]}"` : `⚠ ${m.h1.length} of them`}`);
  console.log(`   headings   ${m.headingJumps ? `⚠ ${m.headingJumps} level jump(s)` : 'ok'}`);
  console.log(`   img alt    ${m.imgNoAlt ? `⚠ ${m.imgNoAlt} missing` : 'ok'}`);
  console.log(`   unnamed    ${m.linkNoText ? `⚠ ${m.linkNoText} link/button with no accessible name` : 'ok'}`);
  console.log(`   focusable  ${m.focusable}`);
  await p.close();
}
await b.close();
