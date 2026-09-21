const { chromium } = require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--headless=new']});
for (const run of [1,2]) {
const mobile = !process.env.DESKTOP;
const p=await b.newPage(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1440,height:900}});
await p.addInitScript(()=>sessionStorage.setItem('space-os:booted','1'));
const t0=Date.now();
await p.goto((process.env.BASE||'http://localhost:3210')+'/',{waitUntil:'load'});
const load=Date.now()-t0;
let first=null, pend=[];
for(let i=0;i<100;i++){ const r=await p.evaluate(()=>{const g=(window.__gls||[]).find(g=>g.domElement.dataset.engine);return {warm:(window.__warmAt||[]).join('+'),tick:window.__cameraFocus?.tick||0,pending:g?g.info.programs.filter(p=>{try{return !p.isReady()}catch(e){return true}}).length:-1,n:g?g.info.programs.length:-1}}); pend.push(r.pending+'/'+r.n+'w'+r.warm); if(r.tick>0){first=Date.now()-t0;break;} await p.waitForTimeout(250);} 
const fam=await p.evaluate(()=>{const g=(window.__gls||[]).find(g=>g.domElement.dataset.engine);const m=new Map();for(const p of g.info.programs){const k=p.name||'shader';m.set(k,(m.get(k)||0)+1)}return [...m].map(([k,v])=>k+'×'+v).join(' ')});
console.log('run',run,'load',load,'first frame +'+first+'ms', pend.join(' '), ' | programs:', fam);
await p.close();
}
await b.close();})();
