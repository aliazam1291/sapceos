// How long does the planet shader take to compile + first draw on this GPU
// (real Chrome, ANGLE)? Bundles planetShader.ts with three, draws one sphere
// per kind on a fresh renderer, and times each first draw to a finished
// readPixels. A fresh browser profile per run, so the GPU program cache is cold.
//   node tools/shaderbench-uat.mjs
// 2026-10-24, Intel UHD: 10-13 s per kind before (all kinds in one program,
// unrolled loops) → 0.3-0.7 s after (KIND define, a real fBm loop). If an
// edit to planetShader.ts pushes a kind past ~1 s, the flight will stutter.
import { chromium } from 'playwright';
import { build } from 'esbuild';
import path from 'node:path';

const entry = `
import * as THREE from 'three';
import { planetVert, planetFrag } from ${JSON.stringify(path.resolve('src/components/space/planetShader.ts').replace(/\\/g, '/'))};
window.bench = () => {
  const out = [];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  document.body.appendChild(canvas);
  const r = new THREE.WebGLRenderer({ canvas });
  r.debug.checkShaderErrors = false;
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50); cam.position.z = 4;
  for (const kind of [0, 1, 2]) {
    const scene = new THREE.Scene();
    const m = new THREE.ShaderMaterial({
      vertexShader: planetVert, fragmentShader: planetFrag, transparent: true,
      defines: { KIND: kind },
      uniforms: { uSea: { value: new THREE.Color('#223') }, uLand: { value: new THREE.Color('#665') }, uAccent: { value: new THREE.Color('#eee') }, uAtmo: { value: new THREE.Color('#8af') }, uSeed: { value: kind + 0.3 }, uKind: { value: kind }, uTime: { value: 1 }, uOpacity: { value: 1 }, uRing: { value: 0 }, uRingN: { value: new THREE.Vector3(0, 1, 0) }, uRingIn: { value: 1.4 }, uRingOut: { value: 2.2 }, uDefocus: { value: 0 } },
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), m));
    const t0 = performance.now();
    r.render(scene, cam);
    const px = new Uint8Array(4);
    const gl = r.getContext();
    gl.readPixels(128, 128, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out.push({ kind, ms: Math.round(performance.now() - t0), px: Array.from(px).join(',') });
  }
  return out;
};
`;
const res = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'js' }, bundle: true, write: false, format: 'iife', loader: { '.ts': 'ts' } });
const js = res.outputFiles[0].text;
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] });
const p = await b.newPage();
await p.setContent('<html><body></body></html>');
await p.addScriptTag({ content: js });
console.log(JSON.stringify(await p.evaluate(() => window.bench())));
await b.close();
