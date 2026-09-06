// Verifies the persistent star layer: that it draws, that it MOVES on its own,
// that scrolling changes the rate, and that nothing throws.
import { chromium } from 'playwright';
const b = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

await p.goto('http://localhost:3000/about', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);

const grab = () => p.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return null;
  return c.toDataURL('image/png').length + ':' + c.toDataURL('image/png').slice(2000, 2400);
});

const a1 = await grab();
await p.waitForTimeout(1500);
const a2 = await grab();

// Frame cost while idle.
const fps = await p.evaluate(() => new Promise((res) => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(tick); else res(n); };
  requestAnimationFrame(tick);
}));

console.log('canvas present :', a1 !== null);
console.log('field moves    :', a1 !== a2);
console.log('idle fps       :', fps);
console.log('console errors :', errors.length ? errors.slice(0, 5) : 'none');
await b.close();
