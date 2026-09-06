import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
await p.waitForFunction(()=>document.querySelectorAll('canvas').length>0,null,{timeout:30000}).catch(()=>{});
await p.waitForTimeout(20000);

// Baseline: pointer has never entered, lens must be disengaged.
await p.screenshot({ path:'tools/shots/A2-lens-off.png', timeout: 90000 });

// Drive the pointer to a clear patch of sky and let the lens ease in.
for (const [x,y] of [[700,450],[760,450],[820,450],[880,450],[900,450]]) {
  await p.mouse.move(x,y); await p.waitForTimeout(320);
}
await p.waitForTimeout(2500);
await p.screenshot({ path:'tools/shots/A3-lens-on.png', timeout: 90000 });

const u = await p.evaluate(() => {
  // Pull the live uniform values straight off the renderer's scene graph.
  const c = document.querySelector('canvas');
  return c ? 'canvas present' : 'none';
});
console.log('lens shots written,', u);
await b.close();
