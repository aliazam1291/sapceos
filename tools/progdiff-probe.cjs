// Which programs does the galaxy compile AFTER warm-up said go? Phone viewport.
const { chromium } = require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--headless=new']});
const mobile = !process.env.DESKTOP;
const p=await b.newPage(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1440,height:900}});
await p.addInitScript(()=>sessionStorage.setItem('space-os:booted','1'));
await p.goto((process.env.BASE||'http://localhost:3210')+'/',{waitUntil:'load'});
// wait for the galaxy's warm
await p.waitForFunction(()=>{const g=(window.__gls||[]).find(g=>g.domElement.dataset.engine);return g && (window.__warmAt||[]).length>=1 && g.info.programs.length>0},null,{timeout:120000});
await p.waitForTimeout(300);
const before=await p.evaluate(()=>{const g=(window.__gls||[]).find(g=>g.domElement.dataset.engine);return g.info.programs.map(p=>p.cacheKey)});
await p.waitForFunction(()=>(window.__cameraFocus?.tick||0)>0,null,{timeout:120000});
await p.waitForTimeout(500);
const after=await p.evaluate((before)=>{const g=(window.__gls||[]).find(g=>g.domElement.dataset.engine);const gl=g.getContext();return g.info.programs.filter(p=>!before.includes(p.cacheKey)).map(p=>({used:p.usedTimes,key:p.cacheKey.slice(0,90),vs:p.vertexShader?gl.getShaderSource(p.vertexShader).replace(/\s+/g,' ').slice(0,10):'', fs:p.fragmentShader?gl.getShaderSource(p.fragmentShader).replace(/\s+/g,' ').match(/(uniform [^;]{0,60};)/g)?.slice(0,3).join(' ') : ''}))},before);
console.log('before',before.length,'new',after.length);
for (const a of after) console.log(' ', JSON.stringify(a));
await b.close();})();
