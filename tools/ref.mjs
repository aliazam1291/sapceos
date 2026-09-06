import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('https://www.wolfcasa.in/', { waitUntil:'networkidle', timeout:60000 }).catch(e=>console.log('nav:',e.message));
await p.waitForTimeout(6000);
await p.screenshot({ path:'tools/shots/REF-1-closed.png', timeout:90000 });

// Find and open the menu control.
const html = await p.content();
console.log('--- buttons/links in header ---');
console.log(JSON.stringify(await p.evaluate(()=>{
  const els=[...document.querySelectorAll('header button, header a, nav button, nav a, [class*=menu], [class*=nav] button')];
  return els.slice(0,20).map(e=>({tag:e.tagName, txt:(e.textContent||'').trim().slice(0,28), cls:String(e.className).slice(0,40)}));
}),null,1));
await b.close();
