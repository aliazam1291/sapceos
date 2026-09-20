// Does every piece of text meet WCAG AA against what it actually sits on?
// For each visible text element: computed colour × opacity, blended over the
// nearest ancestor with a non-transparent background (else the page ground
// #060606), then the contrast ratio; failures are < 4.5:1 (or < 3:1 for large
// text ≥ 24px / ≥ 18.7px bold). Reported per route with the element's class.
//
//   BASE=http://localhost:3210 node tools/contrast-uat.mjs
//   ROUTES=/,/about node tools/contrast-uat.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const routes = (process.env.ROUTES ?? '/,/missions,/missions/vahan-shakti,/field-notes,/field-notes/linear-vs-jira,/about,/decisions,/mission-history,/studio,/writing,/dumbmoney,/contact,/lab').split(',');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));

const audit = () => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(',').map((v) => parseFloat(v));
    return { r, g, b, a };
  };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const GROUND = { r: 6, g: 6, b: 6, a: 1 };
  const bgOf = (el) => {
    let e = el;
    let bg = GROUND;
    const layers = [];
    while (e && e !== document.documentElement) {
      const cs = getComputedStyle(e);
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) layers.unshift(c);
      e = e.parentElement;
    }
    for (const l of layers) bg = blend(l, bg);
    return bg;
  };
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childNodes.length) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (text.length < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    // Effective opacity down the tree.
    let op = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity) || 1;
    if (op < 0.05) continue; // hidden-by-design (reveal animations before arrival)
    const fg = parse(cs.color);
    if (!fg || fg.a === 0) continue; // clipped-gradient text (background-clip: text)
    fg.a *= op;
    const bg = bgOf(el);
    const c = ratio(blend(fg, bg), bg);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const min = large ? 3 : 4.5;
    if (c < min) {
      const key = (el.className || el.tagName).toString().replace(/\S+__/g, '').slice(0, 40) + '|' + cs.color;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ratio: +c.toFixed(2), min, size: Math.round(size), color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, el: key.split('|')[0], text: text.slice(0, 40) });
    }
  }
  return out.sort((a, b) => a.ratio - b.ratio);
};

for (const route of routes) {
  await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
  // Freeze the entrance animations at their end state: off-screen copy sits
  // at low opacity on a view() timeline, and that is not a colour problem.
  await p.addStyleTag({ content: '[data-reveal], .flies, .objectRow, [class*="__row"], [class*="__cell"], [class*="__entry"], [class*="__stop"], [class*="__beat"] { animation: none !important; opacity: 1 !important; transform: none !important; }' });
  await p.waitForTimeout(1500);
  // Let arrival sequences finish so reveal-hidden copy is counted at its final opacity.
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(1200);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(600);
  const fails = await p.evaluate(audit);
  console.log(`${route}: ${fails.length ? fails.length + ' below AA' : 'AA clean'}`);
  for (const f of fails.slice(0, 12)) console.log(`   ${String(f.ratio).padStart(5)}:1 (min ${f.min}) ${f.size}px ${f.color} on ${f.bg}  .${f.el}  “${f.text}”`);
}
await b.close();
