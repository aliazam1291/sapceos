// Who creates and deletes shader programs? A program that is deleted and
// then compiled again with the same key is a synchronous recompile for
// nothing; a program created from render() rather than compileAsync() is a
// synchronous compile the warm-up missed. Patches createProgram /
// deleteProgram on the page and records when, on which canvas, and from
// which call stack — compileAsync (warm, fine), render → getProgram (sync),
// material.dispose (a React re-render replaced a material), renderer.dispose…
//
//   CHROME=1 BOOT=1 node tools/progdelete-uat.mjs /
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.addInitScript((boot) => {
  if (!boot) sessionStorage.setItem('space-os:booted', '1');
  window.__del = [];
  const tag = (c) => {
    let el = c;
    while (el && !el.id && !(typeof el.className === 'string' && el.className)) el = el.parentElement;
    return el ? el.id || el.className.split(' ')[0] : '?';
  };
  for (const proto of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
    for (const name of ['deleteProgram', 'createProgram']) {
      const orig = proto[name];
      proto[name] = function (...a) {
        const frames = (new Error().stack || '').split('\n').slice(2, 12).map((l) => l.trim().replace(/^at /, '').replace(/https?:\/\/[^ ]*\/_next\/static\/chunks\//, ''));
        // compileAsync's compile() vs render(): both go through acquireProgram;
        // the caller two or three frames up tells them apart.
        const stack = frames.slice(0, 7).join(' < ');
        window.__del.push({ at: Math.round(performance.now()), y: Math.round(scrollY), where: tag(this.canvas), op: name === 'createProgram' ? 'create' : 'DELETE', stack });
        return orig.apply(this, a);
      };
    }
  }
}, !!process.env.BOOT);
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(3500);
await p.evaluate(() => new Promise((res) => { const H = document.documentElement.scrollHeight - innerHeight; const t0 = performance.now(); const dur = Math.min(14000, Math.max(3000, (H / 1100) * 1000)); const f = (now) => { const k = Math.min(1, (now - t0) / dur); window.scrollTo(0, H * k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }));
await p.waitForTimeout(2500);
const dels = await p.evaluate(() => window.__del);
// Group identical (time bucket, canvas, stack) rows.
const groups = new Map();
for (const d of dels) {
  const k = `${Math.round(d.at / 100) * 100}|${d.where}|${d.op}|${d.stack}`;
  const g = groups.get(k) ?? { ...d, n: 0 };
  g.n++;
  groups.set(k, g);
}
for (const g of groups.values()) console.log(`@${String(g.at).padStart(5)}ms y=${String(g.y).padStart(5)} ${g.op} ×${String(g.n).padStart(2)} [${g.where}]\n    ${g.stack}`);
console.log(`${dels.filter((d) => d.op === 'create').length} programs created, ${dels.filter((d) => d.op === 'DELETE').length} deleted`);
await b.close();
