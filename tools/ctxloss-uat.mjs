// Did any WebGL context get lost and restored? A restore rebuilds every
// program on that renderer synchronously (three re-inits its program cache),
// which showed up as a whole canvas recompiling identical shaders mid-run.
// Records webglcontextlost/restored on every canvas plus three's own console
// lines, through the launch screen (BOOT=1) or a reading-pace scroll.
//
//   CHROME=1 BOOT=1 node tools/ctxloss-uat.mjs /
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on('console', (m) => {
  const t = m.text();
  if (/context|THREE|WebGL|GPU/i.test(t)) console.log(`  console @${Date.now() % 100000}: ${t.slice(0, 200)}`);
});
await p.addInitScript((boot) => {
  if (!boot) sessionStorage.setItem('space-os:booted', '1');
  window.__ctx = [];
  const tag = (c) => {
    let el = c;
    while (el && !el.id && !(typeof el.className === 'string' && el.className)) el = el.parentElement;
    return el ? el.id || el.className.split(' ')[0] : '?';
  };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) {
    const g = orig.apply(this, a);
    if (g && /webgl/.test(a[0]) && !this.__ctxHooked) {
      this.__ctxHooked = true;
      window.__ctx.push({ at: Math.round(performance.now()), ev: 'create ' + a[0], where: tag(this) });
      this.addEventListener('webglcontextlost', () => window.__ctx.push({ at: Math.round(performance.now()), ev: 'LOST', where: tag(this) }));
      this.addEventListener('webglcontextrestored', () => window.__ctx.push({ at: Math.round(performance.now()), ev: 'restored', where: tag(this) }));
    }
    return g;
  };
}, !!process.env.BOOT);
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(3500);
await p.evaluate(() => new Promise((res) => { const H = document.documentElement.scrollHeight - innerHeight; const t0 = performance.now(); const dur = Math.min(14000, Math.max(3000, (H / 1100) * 1000)); const f = (now) => { const k = Math.min(1, (now - t0) / dur); window.scrollTo(0, H * k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }));
await p.waitForTimeout(2500);
const events = await p.evaluate(() => window.__ctx);
for (const e of events) console.log(`  @${String(e.at).padStart(5)}ms ${e.ev.padEnd(22)} [${e.where}]`);
console.log(`${events.filter((e) => e.ev === 'LOST').length} contexts lost`);
await b.close();
