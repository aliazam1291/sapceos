// Which shader programs does a canvas compile, and when? Snapshots
// renderer.info.programs over time so a program that appears AFTER the
// warm-up (i.e. compiled synchronously at first render) can be named.
//
//   CHROME=1 node tools/programs-uat.mjs /field-notes
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/field-notes';
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
const snap = () =>
  p.evaluate(() => {
    return { perf: document.documentElement.dataset.perf, coarse: matchMedia('(pointer: coarse)').matches, renderers: (window.__gls ?? []).map((gl, i) => ({ renderer: i, shadows: gl.shadowMap.enabled, programs: gl.info.programs.map((pr) => `${pr.name}#${pr.id} used=${pr.usedTimes}`) })) };
  });
for (const t of [1200, 2500, 4000, 6000]) {
  await p.waitForTimeout(t - (await p.evaluate(() => performance.now())) > 0 ? t - (await p.evaluate(() => performance.now())) : 0);
  console.log(`\n@${Math.round(await p.evaluate(() => performance.now()))}ms`, JSON.stringify(await snap(), null, 1));
}
await b.close();
