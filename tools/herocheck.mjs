import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1600,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text().slice(0,200));});
await p.goto('http://localhost:3104',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(14000);
console.log(JSON.stringify(await p.evaluate(()=>{
  const q=s=>document.querySelector(s);
  const g=e=>{if(!e)return null;const r=e.getBoundingClientRect();const c=getComputedStyle(e);return{t:Math.round(r.top),h:Math.round(r.height),w:Math.round(r.width),disp:c.display,vis:c.visibility,op:c.opacity};};
  const panel=[...document.querySelectorAll('div')].find(d=>String(d.className).includes('heroPanel'));
  const copy=[...document.querySelectorAll('div')].find(d=>String(d.className).includes('heroCopy'));
  const shell=[...document.querySelectorAll('div')].find(d=>String(d.className).includes('InteractiveGalaxy')&&String(d.className).includes('shell'));
  return {
    canvases:document.querySelectorAll('canvas').length,
    heroPanel:g(panel), heroCopy:g(copy), galaxyShell:g(shell),
    ledeText: q('main p')?.textContent?.slice(0,40),
    buttons: document.querySelectorAll('main a[href="/missions"], main a[href="/contact"]').length,
    heroH: g(q('section')),
  };
},null),null,1));
console.log('errors:',errs.slice(0,4).join(' | ')||'none');
await b.close();
