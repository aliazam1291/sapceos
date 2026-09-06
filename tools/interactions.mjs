// Interaction inventory: does pointing at a control do anything at all?
//
// Three approaches failed first and are worth not repeating.
//   1. Probing computed styles on the hovered element reports "no feedback" on
//      controls that light up beautifully, because this codebase puts most
//      hover treatment on an ANCESTOR (`.row:hover .title`).
//   2. Screenshot-diffing each control's region never finished: Playwright
//      waits for the page to hold still and the nav clock ticks every second.
//   3. Reading `document.styleSheets[].cssRules` returned ZERO rules from all
//      three sheets — it throws SecurityError — which made every control on
//      every route look inert. That is a false 0%, not a finding.
//
// So: fetch the stylesheet text same-origin, collect every selector that
// mentions :hover, and ask whether each control — or anything it sits inside —
// is what triggers one.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const route of ['/', '/missions', '/field-notes', '/lab', '/orbit', '/about', '/contact', '/mission-history']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);

  const r = await p.evaluate(async () => {
    const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
    let css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    for (const h of hrefs) {
      try { css += '\n' + (await (await fetch(h)).text()); } catch { /* ignore */ }
    }

    const triggers = new Set();
    for (const m of css.matchAll(/([^{}]*:hover[^{}]*)\{/g)) {
      for (const one of m[1].split(',')) {
        const i = one.indexOf(':hover');
        if (i < 0) continue;
        // Everything up to :hover is what you point AT; the rest is what moves.
        const base = one.slice(0, i).trim();
        if (base && !base.startsWith('@')) triggers.add(base);
      }
    }

    const list = [...triggers];
    const dead = [];
    /*
     * Visually-hidden controls are excluded, not counted as failures.
     *
     * The star map publishes its fifteen systems as clipped, focusable buttons
     * so the 3D is operable by keyboard and announced to screen readers. They
     * are 1px boxes behind `clip-path: inset(50%)` — a pointer can never reach
     * one, so "no hover response" is correct behaviour, not a gap. Counting
     * them dropped the home page to 53% and would have invited someone to add
     * hover styling that nothing can ever trigger.
     */
    const hiddenFromPointer = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.clipPath === 'inset(50%)' || cs.clip === 'rect(0px, 0px, 0px, 0px)') return true;
        const r = n.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) return true;
      }
      return false;
    };

    const controls = [...document.querySelectorAll('main a[href], main button:not([disabled])')]
      .filter((el) => !hiddenFromPointer(el));
    for (const el of controls) {
      const box = el.getBoundingClientRect();
      if (box.width < 6 || box.height < 6) continue;
      const responds = list.some((sel) => {
        try { return el.matches(sel) || el.closest(sel); } catch { return false; }
      });
      if (!responds) {
        dead.push((el.innerText || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30));
      }
    }
    return { total: controls.length, dead, rules: list.length };
  });

  const pct = r.total ? Math.round(((r.total - r.dead.length) / r.total) * 100) : 100;
  console.log(`── ${route.padEnd(18)} ${String(r.total).padStart(3)} controls · ${pct}% respond to hover  (${r.rules} hover rules in scope)`);
  if (r.dead.length) console.log(`   inert: ${[...new Set(r.dead)].slice(0, 7).join(' · ')}`);
  await p.close();
}
await b.close();
