import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });

const byType = {};
let total = 0;
p.on('response', async (r) => {
  try {
    const h = r.headers();
    const len = Number(h['content-length'] ?? 0);
    if (!len) return;
    const ct = (h['content-type'] ?? '').split(';')[0];
    byType[ct] = (byType[ct] ?? 0) + len;
    total += len;
  } catch {}
});

// Phase 1: what the user pays for before anything defers in.
await p.goto(BASE, { waitUntil: 'load' });
await p.waitForTimeout(400);
const atLoad = total;
const typesAtLoad = JSON.parse(JSON.stringify(byType));

// Phase 2: after the deferred 3D actually mounts.
await p.waitForFunction(()=>document.querySelectorAll('canvas').length>=1,null,{timeout:20000}).catch(()=>{});
await p.waitForTimeout(3000);

const lcp = await p.evaluate(() => new Promise(res => {
  let v = null;
  new PerformanceObserver(list => { for (const e of list.getEntries()) v = e; })
    .observe({ type:'largest-contentful-paint', buffered:true });
  setTimeout(()=>res(v ? { el: v.element?.tagName + '.' + String(v.element?.className||'').slice(0,40), ms: Math.round(v.startTime) } : null), 600);
}));

const kb = n => (n/1024).toFixed(0) + ' KB';
console.log('--- transferred (content-length) ---');
console.log('at load event :', kb(atLoad));
console.log('after 3D mount:', kb(total), `(+${kb(total-atLoad)} deferred)`);
console.log('\nby type at load:');
for (const [k,v] of Object.entries(typesAtLoad).sort((a,b)=>b[1]-a[1])) console.log('  ', k.padEnd(26), kb(v));
console.log('\nLCP:', JSON.stringify(lcp));
console.log('canvases:', await p.evaluate(()=>document.querySelectorAll('canvas').length));
await b.close();
