import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1600,height:900} });
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
await p.waitForFunction(()=>document.querySelectorAll('canvas').length>0,null,{timeout:40000}).catch(()=>{});
await p.waitForTimeout(9000);
console.log(JSON.stringify(await p.evaluate(() => {
  const out = [];
  // Walk up from every canvas and report any ancestor that paints a box.
  for (const c of document.querySelectorAll('canvas')) {
    let e = c.parentElement, depth = 0;
    const chain = [];
    while (e && depth < 6) {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      const paints =
        (s.backgroundImage !== 'none') ||
        (s.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
        (s.borderTopWidth !== '0px' && s.borderTopColor !== 'rgba(0, 0, 0, 0)') ||
        s.overflow !== 'visible';
      if (paints) chain.push({
        cls: String(e.className).slice(0, 46),
        bgImg: s.backgroundImage.slice(0, 46),
        bgCol: s.backgroundColor,
        border: s.borderTopWidth + ' ' + s.borderTopColor,
        overflow: s.overflow,
        box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      });
      e = e.parentElement; depth++;
    }
    out.push({ canvas: [Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().height)], chain });
  }
  return out;
}), null, 1));
await b.close();
