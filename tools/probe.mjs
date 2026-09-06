import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[];
p.on('console', m => { if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+': '+m.text().slice(0,300)); });
p.on('pageerror', e => errs.push('PAGEERROR: '+String(e).slice(0,400)));
await p.goto('http://localhost:3000', { waitUntil:'networkidle' });
await p.waitForTimeout(3500);
const info = await p.evaluate(() => ({
  canvases: [...document.querySelectorAll('canvas')].map(c => ({
    w:c.width, h:c.height,
    rect:[Math.round(c.getBoundingClientRect().width),Math.round(c.getBoundingClientRect().height)],
    parentCls: c.parentElement?.parentElement?.className || '',
  })),
  deepSpace: (()=>{ const d=document.querySelector('[aria-hidden="true"]'); return null; })(),
  ds: (()=>{ const el=[...document.querySelectorAll('div')].find(d=>d.className&&String(d.className).includes('deepSpace'));
      if(!el) return 'MISSING';
      const s=getComputedStyle(el); const r=el.getBoundingClientRect();
      return { w:Math.round(r.width),h:Math.round(r.height),z:s.zIndex,contain:s.contain,children:el.children.length }; })(),
}));
console.log(JSON.stringify(info,null,1));
console.log('--- console ---'); console.log(errs.slice(0,15).join('\n')||'(none)');
await b.close();
