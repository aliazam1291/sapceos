// Why did a canvas compile the same material twice? Polls every renderer's
// program list (renderer.info.programs) through load and a reading-pace
// scroll, reads each new program's #defines out of its shader source, and
// prints one signature line per program — family (physical / standard /
// sprite / depth / distance / other), lights, shadows, env map, fog, tone
// mapping, sidedness — with a Δ against the previous program of the same
// family on that renderer, so the state change that forced a recompile
// (a light toggled, an env map arriving, a render target) has a name.
//
//   CHROME=1 node tools/progkeys-uat.mjs /            (boot skipped, 1440×900)
//   CHROME=1 BOOT=1 node tools/progkeys-uat.mjs /     (keep the launch screen)
//   KEYS=GGX … prints the raw three cache keys of programs whose fragment
//   source matches, and the fields that differ between consecutive ones —
//   for a warm-up that compiles "the same" shader and still misses.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.addInitScript((boot) => {
  if (!boot) sessionStorage.setItem('space-os:booted', '1');
  window.__progs = [];
  const seen = new WeakSet();
  const src = (gl, sh) => {
    try {
      return gl.getContext().getShaderSource(sh) || '';
    } catch {
      return '';
    }
  };
  const defs = (s) => (s.match(/^#define [^\n]+/gm) || []).map((d) => d.slice(8).trim()).filter((d) => !/^(HIGH_PRECISION|GAMMA_FACTOR|SHADER_TYPE|saturate|whiteCompliment|texture2D|textureCube|texture2DProj|texture2DLodEXT|texture2DProjLodEXT|textureCubeLodEXT|texture2DGradEXT|texture2DProjGradEXT|textureCubeGradEXT|gl_FragColor|gl_FragDepthEXT|varying|attribute|MAX_BONES|PI|PI2|PI_HALF|RECIPROCAL_PI|RECIPROCAL_PI2|EPSILON)\b/.test(d));
  // r185 substitutes the light counts into the source (no #define), so read
  // the uniform array sizes back out of it.
  const arr = (s, name) => { const m = s.match(new RegExp(name + '\\[ (\\d+) \\]')); return m ? m[1] : '0'; };
  setInterval(() => {
    for (const gl of window.__gls ?? []) {
      let el = gl.domElement;
      while (el && !el.id && !(typeof el.className === 'string' && el.className)) el = el.parentElement;
      const where = el ? el.id || el.className.split(' ')[0] : '?';
      for (const pr of gl.info.programs) {
        if (seen.has(pr)) continue;
        seen.add(pr);
        const vs = src(gl, pr.vertexShader);
        const fs = src(gl, pr.fragmentShader);
        const v = defs(vs);
        const f = defs(fs);
        const all = new Set([...v, ...f]);
        const has = (d) => all.has(d);
        const num = (k) => { const m = [...all].find((d) => d.startsWith(k + ' ')); return m ? m.slice(k.length + 1) : '0'; };
        const family = has('DEPTH_PACKING 3200') || has('DEPTH_PACKING 3201') ? 'depth' : has('DISTANCE') ? 'distance' : has('PHYSICAL') ? 'physical' : has('STANDARD') ? 'standard' : has('USE_SIZEATTENUATION') ? 'sprite' : has('USE_INSTANCING') ? 'instanced' : 'other';
        const sig = [
          has('USE_ENVMAP') ? 'env' : '',
          has('USE_FOG') ? 'fog' : '',
          has('USE_SHADOWMAP') ? 'shadow' : '',
          has('TONE_MAPPING') ? 'tone' : 'notone',
          has('OPAQUE') ? 'opaque' : 'blend',
          has('DOUBLE_SIDED') ? 'double' : has('FLIP_SIDED') ? 'back' : 'front',
          has('USE_INSTANCING') ? 'inst' : '',
          has('FLAT_SHADED') ? 'flat' : '',
          has('USE_CLEARCOAT') ? 'clearcoat' : '',
          has('USE_MAP') ? 'map' : '',
          has('STANDARD') || has('PHYSICAL') ? `dir${arr(fs, 'directionalLights')} pt${arr(fs, 'pointLights')} spot${arr(fs, 'spotLights')} hemi${arr(fs, 'hemisphereLights')} dirSh${arr(fs, 'directionalLightShadows')} spotSh${arr(fs, 'spotLightShadows')}` : '',
        ].filter(Boolean).join(' ');
        // Everything else that is in the key: the full define set plus the
        // output transfer function (colour space) and the shadow type.
        const out = (fs.match(/linearToOutputTexel[^}]*}/) || [''])[0].replace(/\s+/g, ' ');
        const full = [...all].filter((d) => !/^(RE_|CUBEUV_|STANDARD|PHYSICAL)/.test(d)).concat(['OUT ' + out]);
        const keyed = window.__keys && new RegExp(window.__keys).test(fs) ? pr.cacheKey : undefined;
        window.__progs.push({ at: Math.round(performance.now()), y: Math.round(scrollY), where, name: family, id: pr.id, sig, defs: full, key: keyed });
      }
    }
  }, 60);
}, !!process.env.BOOT);
if (process.env.KEYS) await p.addInitScript((k) => { window.__keys = k; }, process.env.KEYS);
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(3500);
await p.evaluate(() => new Promise((res) => { const H = document.documentElement.scrollHeight - innerHeight; const t0 = performance.now(); const dur = Math.min(14000, Math.max(3000, (H / 1100) * 1000)); const f = (now) => { const k = Math.min(1, (now - t0) / dur); window.scrollTo(0, H * k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }));
await p.waitForTimeout(2500);
const progs = await p.evaluate(() => window.__progs);

const byRenderer = new Map();
for (const pr of progs) {
  if (!byRenderer.has(pr.where)) byRenderer.set(pr.where, []);
  byRenderer.get(pr.where).push(pr);
}
for (const [where, list] of byRenderer) {
  console.log(`\n[${where}] ${list.length} programs`);
  const lastByName = new Map();
  for (const pr of list) {
    const prev = lastByName.get(pr.name);
    let diff = '';
    if (prev) {
      const a = new Set(prev.defs);
      const c = new Set(pr.defs);
      const gone = [...a].filter((d) => !c.has(d));
      const added = [...c].filter((d) => !a.has(d));
      diff = gone.length || added.length ? `  Δ ${[...gone.map((d) => '−' + d), ...added.map((d) => '+' + d)].join(' ')}` : '  Δ (identical source — a program deleted and rebuilt)';
    }
    console.log(`  @${String(pr.at).padStart(5)}ms y=${String(pr.y).padStart(5)} ${pr.name.padEnd(9)}#${String(pr.id).padEnd(3)} ${pr.sig}${diff}`);
    lastByName.set(pr.name, pr);
  }
}
if (process.env.KEYS) {
  const keyed = progs.filter((pr) => pr.key);
  console.log(`\nraw cache keys matching /${process.env.KEYS}/: ${keyed.length}`);
  for (let i = 0; i < keyed.length; i++) {
    const pr = keyed[i];
    console.log(`  @${pr.at}ms [${pr.where}] #${pr.id}\n    ${pr.key}`);
    if (i > 0 && keyed[i - 1].where === pr.where) {
      const a = keyed[i - 1].key.split(',');
      const c = pr.key.split(',');
      const d = [];
      for (let j = 0; j < Math.max(a.length, c.length); j++) if (a[j] !== c[j]) d.push(`[${j}] ${a[j]} → ${c[j]}`);
      console.log(`    Δ vs #${keyed[i - 1].id}: ${d.length ? d.join(' · ') : 'identical'}`);
    }
  }
}
await b.close();
