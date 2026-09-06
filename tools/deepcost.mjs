// Comparative frame cost: same page, star layer painting vs not painting.
import { chromium } from 'playwright';
const b = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000/about', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);

const fps = () => p.evaluate(() => new Promise((res) => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else res(Math.round(n / 1.5)); };
  requestAnimationFrame(tick);
}));

console.log('with star layer   :', await fps(), 'fps');
await p.evaluate(() => { const c = document.querySelector('canvas'); if (c) c.style.display = 'none'; });
await p.waitForTimeout(400);
console.log('layer not painted :', await fps(), 'fps');
await b.close();
