import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1600,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push('PE: '+String(e).slice(0,400)));
p.on('console',m=>{const t=m.text(); if(/error|fail|warn|webgl|context/i.test(t)) errs.push(m.type()+': '+t.slice(0,250));});
const reqs=[];
p.on('request',r=>{if(/\.js/.test(r.url()))reqs.push(r.url().split('/').pop());});
await p.goto('http://localhost:3104',{waitUntil:'load'});
await p.waitForTimeout(16000);
console.log(JSON.stringify(await p.evaluate(()=>{
  const panel=[...document.querySelectorAll('div')].find(d=>String(d.className).includes('heroPanel'));
  return {
    canvases: document.querySelectorAll('canvas').length,
    panelHTML: panel ? panel.innerHTML.slice(0,260) : 'NO PANEL',
    panelChildren: panel ? panel.children.length : -1,
    bodyHasGalaxyClass: /InteractiveGalaxy/.test(document.body.innerHTML),
  };
},null),null,1));
console.log('--- messages ---'); console.log(errs.slice(0,6).join('\n')||'none');
await b.close();
