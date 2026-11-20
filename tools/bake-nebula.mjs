// Bakes the galaxy's four nebula cloud textures to PNGs (2026-11-20).
// Nebula.tsx used to compute them at startup — 4 × 256² pixels of two-octave
// value noise, ~350 ms of main thread at 4× CPU. Same seeds, same maths,
// computed once here.  node tools/bake-nebula.mjs → public/textures/nebula-N.png
import { chromium } from "playwright";
import fs from "node:fs";

const b = await chromium.launch();
const p = await b.newPage();
const urls = await p.evaluate(() => {
  function noise2(x, y, seed) {
    const h = (i, j) => {
      const n = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const i = Math.floor(x), j = Math.floor(y);
    const fx = x - i, fy = y - j;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  return [1, 2, 3, 4].map((s) => {
    const seed = s * 3.7, size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = (x / size - 0.5) * 2, dy = (y / size - 0.5) * 2;
        const r = Math.sqrt(dx * dx + dy * dy);
        const fall = Math.max(0, 1 - r * r) ** 1.6;
        const n = noise2(x / 38, y / 38, seed) * 0.6 + noise2(x / 13, y / 13, seed + 9) * 0.4;
        const a = Math.max(0, fall * (n * 1.4 - 0.25));
        const k = (y * size + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
        img.data[k + 3] = Math.min(255, a * 255);
      }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL("image/png");
  });
});
fs.mkdirSync("public/textures", { recursive: true });
urls.forEach((u, i) => {
  const f = `public/textures/nebula-${i + 1}.png`;
  fs.writeFileSync(f, Buffer.from(u.split(",")[1], "base64"));
  console.log(f, Math.round(fs.statSync(f).size / 1024) + " KB");
});
await b.close();
