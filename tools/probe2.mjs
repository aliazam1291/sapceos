import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
p.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0,500)));
p.on('console', m => { const t=m.text(); if(/error|fail|warn/i.test(t)) console.log('CONSOLE:', t.slice(0,300)); });
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
const r = await p.evaluate(() => new Promise(res => {
  const out = { hasRIC: typeof window.requestIdleCallback === 'function', fired:false, ms:0 };
  const t0 = performance.now();
  if (out.hasRIC) window.requestIdleCallback(()=>{ out.fired=true; out.ms=Math.round(performance.now()-t0); }, {timeout:2000});
  setTimeout(()=>res(out), 4000);
}));
console.log('requestIdleCallback:', JSON.stringify(r));
const webgl = await p.evaluate(()=>{ const c=document.createElement('canvas'); const g=c.getContext('webgl2')||c.getContext('webgl'); return !!g; });
console.log('webgl available:', webgl);
await p.waitForTimeout(2000);
console.log('canvases now:', await p.evaluate(()=>document.querySelectorAll('canvas').length));
await b.close();
