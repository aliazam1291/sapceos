// Every route at large-monitor sizes: overflow, content width, and any element
// escaping the viewport. The responsive pass only covered the home page.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const routes = ['/', '/missions', '/galaxy', '/lab', '/orbit', '/field-notes', '/about', '/mission-history', '/contact'];

for (const [w, h] of [[2560, 1440], [3840, 2160]]) {
  console.log(`\n── ${w}x${h}`);
  for (const route of routes) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const r = await p.evaluate(() => {
      const main = document.querySelector('main');
      const mr = main.getBoundingClientRect();
      // Widest text block actually used by content.
      const blocks = [...main.querySelectorAll('h1,h2,p,section > div')]
        .map((e) => e.getBoundingClientRect())
        .filter((x) => x.width > 40);
      const widest = blocks.length ? Math.round(Math.max(...blocks.map((x) => x.width))) : 0;
      const escapes = [...main.querySelectorAll('*')].filter((e) => {
        const x = e.getBoundingClientRect();
        return x.width > 0 && (x.right > innerWidth + 2 || x.left < -2);
      }).length;
      return {
        widest,
        pct: Math.round((widest / innerWidth) * 100),
        hScroll: document.documentElement.scrollWidth > innerWidth + 1,
        escapes,
        screens: (document.documentElement.scrollHeight / innerHeight).toFixed(1),
      };
    });
    console.log(
      `  ${route.padEnd(18)} widest ${String(r.widest).padStart(4)}px (${String(r.pct).padStart(2)}%)` +
      ` · ${r.screens} screens · h-scroll ${r.hScroll ? 'YES' : 'no'} · escaping ${r.escapes}`,
    );
    await p.close();
  }
}
await b.close();
