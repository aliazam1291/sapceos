// Probe the companion's copy-avoidance primitive: at a scroll position, ask
// the page what is under the ship and what the hit-test says about a grid of
// points, so a wrong "clear"/"copy" answer can be traced to its cause.
//
//   node tools/copyhit-uat.mjs /missions 1000
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const route = process.argv[2] ?? '/missions';
const y = +(process.argv[3] ?? 0);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
await p.goto(BASE + route, { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const ss = window.__shipState;
  const copyAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return 'none';
    if (!el.closest('main, footer')) return `outside:${el.tagName}.${(el.className || '').toString().slice(0, 24)}`;
    if (el.closest('canvas, svg, img, picture, video')) return 'object';
    const pos = document.caretPositionFromPoint?.(x, y);
    const node = pos?.offsetNode ?? document.caretRangeFromPoint?.(x, y)?.startContainer ?? null;
    let onGlyph = false;
    if (node && node.nodeType === 3 && (node.textContent ?? '').trim()) {
      const r = document.createRange();
      r.selectNodeContents(node);
      for (const rect of r.getClientRects()) if (x >= rect.left - 6 && x <= rect.right + 6 && y >= rect.top - 6 && y <= rect.bottom + 6) onGlyph = true;
    }
    const leaf = el.children.length === 0 && (el.textContent ?? '').trim().length > 0;
    return `${onGlyph || leaf ? 'COPY' : 'clear'} el=${el.tagName}.${(el.className || '').toString().slice(0, 28)} text=${JSON.stringify((node?.textContent ?? '').slice(0, 30))} glyph=${onGlyph} leaf=${leaf}`;
  };
  const cx = (ss.x * 0.5 + 0.5) * innerWidth;
  const cy = (0.5 - ss.y * 0.5) * innerHeight;
  const rows = [];
  for (const [dx, dy] of [[0, 0], [-100, 0], [100, 0], [0, 35], [0, -120], [260, -100], [500, -100]]) rows.push(`(${Math.round(cx + dx)},${Math.round(cy + dy)}) ${copyAt(cx + dx, cy + dy)}`);
  // A coarse map of the top half: C where copy is detected, . where clear.
  const map = [];
  for (let yy = 40; yy < innerHeight * 0.6; yy += 60) { let line = String(yy).padStart(4) + ' '; for (let xx = 40; xx < innerWidth; xx += 60) line += copyAt(xx, yy).startsWith('COPY') ? 'C' : copyAt(xx, yy) === 'object' ? 'o' : '.'; map.push(line); }
  return { ship: { x: Math.round(cx), y: Math.round(cy), on: ss.on }, rows, map };
});
console.log(JSON.stringify(out, null, 2));
await b.close();
