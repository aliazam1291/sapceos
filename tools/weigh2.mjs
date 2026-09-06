import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3100';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto(BASE, { waitUntil: 'load' });
await p.waitForTimeout(500);

const snap = () => p.evaluate(() => {
  const rs = performance.getEntriesByType('resource');
  const g = {};
  let total = 0;
  for (const r of rs) {
    const t = r.initiatorType === 'script' ? 'js'
            : r.initiatorType === 'css' || /\.css/.test(r.name) ? 'css'
            : /\.woff2/.test(r.name) ? 'font' : r.initiatorType;
    g[t] = (g[t] ?? 0) + r.transferSize;
    total += r.transferSize;
  }
  const nav = performance.getEntriesByType('navigation')[0];
  return { total: total + (nav?.transferSize ?? 0), doc: nav?.transferSize ?? 0, g };
});

const before = await snap();
await p.waitForFunction(()=>document.querySelectorAll('canvas').length>=1,null,{timeout:20000}).catch(()=>{});
await p.waitForTimeout(3500);
const after = await snap();

const kb = n => (n/1024).toFixed(0).padStart(5) + ' KB';
console.log('=== FIRST LOAD (before deferred 3D) ===');
console.log('  total       ', kb(before.total));
for (const [k,v] of Object.entries(before.g).sort((a,b)=>b[1]-a[1])) console.log('   ', k.padEnd(10), kb(v));
console.log('\n=== AFTER 3D MOUNTS ===');
console.log('  total       ', kb(after.total), `  (+${kb(after.total-before.total).trim()} deferred)`);
for (const [k,v] of Object.entries(after.g).sort((a,b)=>b[1]-a[1])) console.log('   ', k.padEnd(10), kb(v));
await b.close();
