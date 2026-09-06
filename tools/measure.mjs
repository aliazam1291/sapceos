import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
await p.waitForFunction(()=>document.querySelectorAll('canvas').length>=1,null,{timeout:30000}).catch(()=>{});
await p.waitForTimeout(3500);
const out = await p.evaluate(() => {
  const vh = window.innerHeight;
  const rows = [...document.querySelectorAll('main > *, main section, .pin-spacer')].map(el => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: String(el.className).slice(0,60),
      topVH: +(( r.top + window.scrollY)/vh).toFixed(2),
      hVH: +(r.height/vh).toFixed(2),
    };
  });
  return { docVH:+(document.body.scrollHeight/vh).toFixed(2), rows };
});
console.log(JSON.stringify(out,null,1));
await b.close();
