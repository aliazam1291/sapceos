// Which WebGL program made the main thread wait? Patches
// getProgramParameter / getProgramInfoLog on the page before any script
// runs, times every call, and for the slow ones prints when it happened and
// the defines of the shader it was waiting on — enough to name the material.
//
//   CHROME=1 node tools/glblock-uat.mjs /field-notes
//   CHROME=1 SCROLL=1 DESKTOP=1 node tools/glblock-uat.mjs /   (scroll the page too;
//                                                             1440×900 instead of the phone)
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/field-notes';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const ctx = await b.newContext(process.env.DESKTOP ? { viewport: { width: 1440, height: 900 } } : { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.text().startsWith('[shipEnv]')) console.log('  console:', m.text()); });
await p.addInitScript(() => {
  try { sessionStorage.setItem('space-os:debug', '1'); } catch {}
  window.__glWaits = [];
  for (const proto of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
    for (const name of ['getProgramParameter', 'getProgramInfoLog', 'getActiveUniform', 'getUniformLocation', 'getShaderInfoLog']) {
      const orig = proto[name];
      proto[name] = function (...args) {
        const t0 = performance.now();
        const r = orig.apply(this, args);
        const dt = performance.now() - t0;
        if (dt > 20) {
          let defines = '';
          try {
            const prog = args[0];
            const shaders = prog && this.getAttachedShaders ? this.getAttachedShaders(prog) : null;
            const fs = shaders?.find((s) => this.getShaderParameter(s, this.SHADER_TYPE) === this.FRAGMENT_SHADER);
            const src = fs ? this.getShaderSource(fs) : '';
            defines = (src.match(/^#define \w+/gm) || []).map((d) => d.slice(8)).filter((d) => !/^(HIGH_PRECISION|SHADER_TYPE|SHADER_NAME|GAMMA_FACTOR)/.test(d)).slice(0, 14).join(' ');
            const nm = src.match(/SHADER_NAME (\w+)/)?.[1];
            defines = (nm ? nm + ': ' : '') + defines;
          } catch {}
          // Which canvas: the section it sits in, or the nearest class name.
          let where = '';
          try {
            const c = this.canvas;
            // R3F wraps every canvas in an anonymous div: walk up to the first
            // ancestor with an id or a class, and add the canvas size.
            let el = c;
            while (el && !el.id && !(typeof el.className === 'string' && el.className)) el = el.parentElement;
            where = (el ? el.id || el.className.split(' ')[0] : '?') + ' ' + c.width + 'x' + c.height;
          } catch {}
          // Which query: LINK_STATUS (three's onFirstUse — a program used before it
          // linked), COMPLETION_STATUS_KHR (compileAsync's poll — should never block),
          // ACTIVE_UNIFORMS… — and who asked.
          const PN = { 35714: 'LINK_STATUS', 37297: 'COMPLETION_STATUS_KHR', 35718: 'ACTIVE_UNIFORMS', 35721: 'ACTIVE_ATTRIBUTES', 35713: 'COMPILE_STATUS', 35712: 'DELETE_STATUS', 35715: 'VALIDATE_STATUS' };
          const pname = typeof args[1] === 'number' ? PN[args[1]] || '0x' + args[1].toString(16) : '';
          const stack = (new Error().stack || '').split('\n').slice(2, 6).map((l) => l.trim().replace(/^at /, '').replace(/https?:\/\/[^ ]*\/_next\/static\/chunks\//, '')).join(' < ');
          window.__glWaits.push({ at: Math.round(t0), ms: Math.round(dt), call: name + (pname ? '(' + pname + ')' : ''), defines, where, y: Math.round(scrollY), stack });
        }
        return r;
      };
    }
  }
});
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
if (process.env.SCROLL) {
  await p.waitForTimeout(3500);
  await p.evaluate(() => new Promise((res) => { const H = document.documentElement.scrollHeight - innerHeight; const t0 = performance.now(); const dur = Math.min(14000, Math.max(3000, (H / 1100) * 1000)); const f = (now) => { const k = Math.min(1, (now - t0) / dur); window.scrollTo(0, H * k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }));
  await p.waitForTimeout(1500);
} else await p.waitForTimeout(9000);
const waits = await p.evaluate(() => window.__glWaits);
console.log(`${waits.length} blocking GL queries (>20ms):`);
for (const w of waits) console.log(`  @${w.at}ms y=${w.y} +${w.ms}ms ${w.call} [${w.where}]  ${w.defines.slice(0, 60)}\n      ${w.stack}`);
await b.close();
