// Measures the actual composited ground colour of the hero.
//
// The direction says the page sits on #050505. Stacked teal washes (spotlight,
// panel glow, nebula, galaxy bloom) each look subtle alone and together lift
// the whole frame off black — this reads the result rather than guessing at it.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000/' + (process.argv[2] ?? ''), { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 1, null, { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3200);
const shot = (await p.screenshot({ timeout: 120000 })).toString('base64');

const r = await p.evaluate((b64) => new Promise((res) => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const at = (x, y) => {
      // 9x9 median-ish average, so a star doesn't skew the reading.
      const d = g.getImageData(x - 4, y - 4, 9, 9).data;
      let r = 0, gg = 0, bb = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; }
      const n = d.length / 4;
      return [Math.round(r / n), Math.round(gg / n), Math.round(bb / n)];
    };
    res({
      'top-left corner  ': at(30, 30),
      'behind headline  ': at(120, 230),
      'under the lede   ': at(90, 700),
      'mid gutter       ': at(560, 200),
      'far right edge   ': at(1410, 700),
    });
  };
  img.src = 'data:image/png;base64,' + b64;
}), shot);

for (const [k, v] of Object.entries(r)) console.log(k, 'rgb(' + v.join(', ') + ')');
await b.close();
