// One frame per declared section, so the page can be judged as a sequence of
// beats rather than as a set of components. Sections announce themselves with
// `data-section`, the same contract the right-edge rail uses.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('tools/shots', { recursive: true });

const BASE = process.env.BASE ?? 'http://localhost:3000';
const route = process.argv[2] ?? '/';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await p.context().newCDPSession(p);

await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 2, null, { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3500);

const sections = await p.evaluate(() =>
  [...document.querySelectorAll('[data-section]')].map((el) => ({
    label: el.dataset.section,
    top: el.getBoundingClientRect().top + window.scrollY,
  })));

console.log(sections.map((s) => `${s.label}@${Math.round(s.top)}`).join('  '));

for (const [i, s] of sections.entries()) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), s.top);
  await p.waitForTimeout(2000);
  const file = `tools/shots/F${i + 1}-${s.label.toLowerCase().replace(/\W+/g, '-')}.png`;
  const data = (await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data;
  const { writeFileSync } = await import('node:fs');
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log('shot', file);
}
await b.close();
