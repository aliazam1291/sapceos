// What breaks on a large monitor? Content width vs viewport, overflow, and
// whether the pinned flight still frames its subject.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

for (const [w, h] of [[1440, 900], [2560, 1440], [3440, 1440], [3840, 2160]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const hero = document.querySelector('[data-section="Arrival"]');
    const heroInner = hero.querySelector('h1');
    const shell = getComputedStyle(document.documentElement).getPropertyValue('--shell-max');
    const heroH = hero.getBoundingClientRect();
    // How much of the width does page content actually use?
    const sec = document.querySelector('#fragments [class*="head"]');
    const sr = sec.getBoundingClientRect();
    return {
      shellMax: shell.trim(),
      contentWidth: Math.round(sr.width),
      usedPct: Math.round((sr.width / innerWidth) * 100),
      h1px: Math.round(parseFloat(getComputedStyle(heroInner).fontSize)),
      heroVh: (heroH.height / innerHeight).toFixed(2),
      hScroll: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  console.log(
    `${String(w).padStart(4)}x${String(h).padStart(4)}  content ${String(r.contentWidth).padStart(4)}px = ${String(r.usedPct).padStart(2)}% of width` +
    ` · h1 ${r.h1px}px · hero ${r.heroVh}vh · h-scroll ${r.hScroll}`,
  );
  await p.close();
}
await b.close();
