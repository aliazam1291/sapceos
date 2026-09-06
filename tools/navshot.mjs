import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w, h, tag] of [[1440, 900, 'desktop'], [768, 900, 'tablet'], [390, 844, 'mobile']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:3000/missions', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  const box = await p.evaluate(() => {
    const el = document.querySelector('header');
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await p.screenshot({
    path: `tools/shots/N-${tag}.png`,
    clip: { x: Math.max(0, box.x), y: Math.max(0, box.y - 30), width: Math.min(box.width, w), height: box.height + 30 },
    timeout: 120000,
  });
  console.log(tag, JSON.stringify(box));
  await p.close();
}
await b.close();
