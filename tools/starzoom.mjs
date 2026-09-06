import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:3000/lab',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>document.querySelectorAll('canvas').length>0,null,{timeout:40000}).catch(()=>{});
await p.waitForTimeout(9000);
// Crop a patch of empty sky and blow it up so the star shading is visible.
await p.screenshot({ path:'tools/shots/K2-starzoom.png', clip:{x:820,y:120,width:420,height:280}, timeout:120000 });
console.log('star crop written');
await b.close();
