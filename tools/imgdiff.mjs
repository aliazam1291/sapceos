/*
 * Numeric difference between two PNGs, decoded in a real browser so no image
 * library is needed. Reports mean and max per-channel delta plus the share of
 * pixels that differ at all — "looks the same" is not a measurement, and the
 * glows this is used on are faint enough that a real regression could hide
 * under a casual comparison.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [a, b] = process.argv.slice(2);
const enc = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64');

const br = await chromium.launch();
const pg = await br.newPage();
const r = await pg.evaluate(async ([sa, sb]) => {
  const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = s; });
  const [ia, ib] = await Promise.all([load(sa), load(sb)]);
  const px = (img) => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return g.getImageData(0, 0, img.width, img.height).data;
  };
  const A = px(ia), B = px(ib);
  if (A.length !== B.length) return { error: 'different dimensions' };
  let sum = 0, max = 0, diff = 0, n = 0;
  for (let i = 0; i < A.length; i += 4) {
    let d = 0;
    for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(A[i + k] - B[i + k]));
    sum += d; if (d > max) max = d; if (d > 0) diff++; n++;
  }
  return { mean: +(sum / n).toFixed(3), max, pctDiffer: +((diff / n) * 100).toFixed(1), n };
}, [enc(a), enc(b)]);

console.log(r.error ?? `mean delta: ${r.mean}/255   max delta: ${r.max}/255   pixels differing at all: ${r.pctDiffer}%`);
await br.close();
