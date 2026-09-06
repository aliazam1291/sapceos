import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('tools/shots', { recursive: true });
const BASE = 'http://localhost:3105';

async function run(label, opts, { shot, pct = 0 } = {}) {
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage(opts);
  const js = new Map();
  p.on('response', r => { if (/\.js(\?|$)/.test(r.url())) js.set(r.url(), true); });
  await p.goto(BASE, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const jsAtLoad = js.size;
  await p.waitForFunction(()=>document.querySelectorAll('canvas').length>=1,null,{timeout:15000}).catch(()=>{});
  await p.waitForTimeout(3200);
  if (pct) {
    await p.evaluate(v => window.scrollTo({top:(document.body.scrollHeight-innerHeight)*(v/100),behavior:'instant'}), pct);
    await p.waitForTimeout(2200);
  }
  const info = await p.evaluate(() => ({
    canvases: document.querySelectorAll('canvas').length,
    docVH: +(document.body.scrollHeight/innerHeight).toFixed(1),
    seqLive: !!document.querySelector('[class*=sequence][data-live]'),
    beats: document.querySelectorAll('[class*=beat]').length,
    totalJsKb: Math.round(performance.getEntriesByType('resource')
      .filter(r=>/\.js(\?|$)/.test(r.name)).reduce((a,r)=>a+r.transferSize,0)/1024),
  }));
  if (shot) await p.screenshot({ path: `tools/shots/${shot}.png` });
  console.log(label.padEnd(22), JSON.stringify({ jsReqAtLoad: jsAtLoad, ...info }));
  await b.close();
}

await run('desktop', { viewport:{width:1440,height:900} }, { shot:'40-final-hero' });
await run('desktop @ beat3', { viewport:{width:1440,height:900} }, { shot:'41-final-beat', pct:32 });
await run('mobile 390', { viewport:{width:390,height:844}, isMobile:true, hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36' }, { shot:'42-final-mobile' });
await run('reduced-motion', { viewport:{width:1440,height:900}, reducedMotion:'reduce' }, { shot:'43-final-reduced' });
