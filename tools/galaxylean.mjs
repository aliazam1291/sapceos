// Does the hero stage answer the pointer when it is NOT over a node?
//
// Two earlier metrics were useless and are worth not repeating. "The frame
// changed" is meaningless because the nodes tumble continuously, so any two
// samples differ. Comparing PNG BYTES is worse: compression means almost every
// byte differs once anything moves, so both the test and the control saturate
// at the same number.
//
// This decodes the frames and takes a mean absolute pixel difference, against a
// control pair captured with the cursor parked over the same interval — the
// scene's own idle drift. Only a pointer-driven change well above that baseline
// means the lean is real.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await p.context().newCDPSession(p);
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelectorAll('canvas').length >= 2, null, { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4000);

const clip = { x: 640, y: 300, width: 520, height: 380, scale: 1 };
const hold = async (x, y, ms) => {
  await p.mouse.move(x, y);
  await p.waitForTimeout(ms);
  return (await cdp.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: false })).data;
};

// Mean absolute difference cannot discriminate here: the nodes tumble and the
// spiral rotates, so a busy scene posts a large number whether the camera moved
// or not. A camera lean TRANSLATES the image, which tumbling does not — so the
// horizontal centroid of the lit pixels is the measurement that separates them.
const centroid = (a) => p.evaluate((A) => new Promise((res) => {
  const i = new Image();
  i.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = i.width; cv.height = i.height;
    const g = cv.getContext('2d');
    g.drawImage(i, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const o = (y * cv.width + x) * 4;
      const lum = (d[o] + d[o + 1] + d[o + 2]) / 3;
      if (lum > 26) { sx += x * lum; sy += y * lum; n += lum; }
    }
    res(n ? { x: +(sx / n).toFixed(2), y: +(sy / n).toFixed(2) } : null);
  };
  i.src = 'data:image/png;base64,' + A;
}), a);

const mad = (a, c) => p.evaluate(([A, B]) => new Promise((res) => {
  const load = (d) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + d; });
  Promise.all([load(A), load(B)]).then(([ia, ib]) => {
    const cv = document.createElement('canvas');
    cv.width = ia.width; cv.height = ia.height;
    const g = cv.getContext('2d');
    g.drawImage(ia, 0, 0);
    const da = g.getImageData(0, 0, cv.width, cv.height).data;
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(ib, 0, 0);
    const db = g.getImageData(0, 0, cv.width, cv.height).data;
    let sum = 0;
    for (let i = 0; i < da.length; i += 4) sum += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    res(+(sum / (da.length / 4) / 3).toFixed(3));
  });
}), [a, c]);

// Control: cursor parked, same interval — this is the scene's own drift.
const c1 = await centroid(await hold(200, 450, 1600));
const c2 = await centroid(await hold(200, 450, 1600));
const idle = Math.hypot(c2.x - c1.x, c2.y - c1.y);

// Test: cursor swept from one edge of the viewport to the other.
const l = await centroid(await hold(60, 450, 1800));
const r = await centroid(await hold(1380, 450, 1800));
const moved = Math.hypot(r.x - l.x, r.y - l.y);

console.log(`idle drift (cursor parked) : centroid moved ${idle.toFixed(2)}px`);
console.log(`cursor swept left → right  : centroid moved ${moved.toFixed(2)}px  (dx ${(r.x - l.x).toFixed(1)})`);
console.log(moved > Math.max(idle * 3, 4) ? `→ the stage leans with the pointer` : '→ no lean beyond idle drift');
await b.close();
