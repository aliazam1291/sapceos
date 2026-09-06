// The project's own self-verification checklist asks: "Is text immediately
// readable without client-side JS?" This answers it.
//
// Loads each route with JavaScript disabled and counts text that is present in
// the DOM but invisible — opacity 0, zero height, or clipped — which is exactly
// what a reveal animation leaves behind when its script never arrives.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });

for (const route of ['/', '/missions', '/about', '/contact', '/mission-history', '/field-notes']) {
  const p = await ctx.newPage();
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => {
    const hidden = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,li,a,button')) {
      const txt = (el.textContent ?? '').trim();
      if (!txt || el.children.length > 2) continue;
      const s = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      if (s.opacity === '0' || s.visibility === 'hidden' || s.display === 'none' || box.height === 0) {
        const why = s.opacity === '0' ? 'opacity:0'
          : s.visibility === 'hidden' ? 'visibility:hidden'
          : s.display === 'none' ? 'display:none'
          : `height:0 (clip:${s.clipPath}, maxH:${s.maxHeight}, overflow:${s.overflow})`;
        hidden.push(`${el.tagName}.${(el.className || '(none)').toString().slice(0, 40)} [${why}] "${txt.slice(0, 30)}"`);
      }
    }
    return {
      hidden,
      words: (document.querySelector('main')?.innerText ?? '').split(/\s+/).filter(Boolean).length,
      h1: document.querySelector('h1')?.innerText.slice(0, 40) ?? 'MISSING',
    };
  });
  console.log(
    `${route.padEnd(18)} ${String(r.words).padStart(5)} words readable · h1 "${r.h1.replace(/\n/g, ' ')}"` +
      (r.hidden.length ? `\n${' '.repeat(18)} ⚠ ${r.hidden.length} hidden: ${r.hidden.slice(0, 3).join(', ')}` : ''),
  );
  await p.close();
}
await b.close();
