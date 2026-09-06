import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[];
p.on('pageerror', e => errs.push('PAGEERROR: '+String(e).slice(0,300)));
p.on('console', m => { if(m.type()==='error') errs.push('ERR: '+m.text().slice(0,250)); });
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
await p.waitForTimeout(14000);
const r = await p.evaluate(() => {
  const seq = document.querySelector('[class*=sequence]');
  return {
    seqFound: !!seq,
    dataLive: seq?.getAttribute('data-live'),
    seqHeightVH: seq ? +(seq.getBoundingClientRect().height/innerHeight).toFixed(2) : null,
    pinSpacer: !!document.querySelector('.pin-spacer'),
    canvases: document.querySelectorAll('canvas').length,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    jsMotion: document.documentElement.classList.contains('js-motion'),
  };
});
console.log(JSON.stringify(r,null,1));
console.log('--- errors ---'); console.log(errs.slice(0,8).join('\n')||'(none)');
await b.close();
