import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
await p.waitForFunction(()=>document.querySelector('[class*=sequence][data-live]'),null,{timeout:40000}).catch(()=>console.log('not live'));
await p.waitForTimeout(9000);
await p.evaluate(()=>window.scrollTo({top:(document.body.scrollHeight-innerHeight)*0.20,behavior:'instant'}));
await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(()=>{
  const g=e=>{if(!e)return null;const r=e.getBoundingClientRect();const s=getComputedStyle(e);return{top:Math.round(r.top),left:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height),pos:s.position,z:s.zIndex};};
  return {
    canvases: document.querySelectorAll('canvas').length,
    stage: g(document.querySelector('[class*=stage]')),
    seqCanvas: g(document.querySelector('[class*=stage] canvas')),
    hud: g(document.querySelector('[class*=hud]')),
    screen: g(document.querySelector('[class*=screen]')),
  };
},null),null,1));
await b.close();
