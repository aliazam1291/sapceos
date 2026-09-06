import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:3100', { waitUntil: 'load' });
await p.waitForTimeout(600);
const list = await p.evaluate(() => performance.getEntriesByType('resource')
  .filter(r => /\.js/.test(r.name))
  .map(r => ({ n: r.name.split('/').pop(), kb: +(r.transferSize/1024).toFixed(1), start: Math.round(r.startTime) }))
  .sort((a,b)=>b.kb-a.kb).slice(0,12));
console.log('--- JS at load ---');
for (const r of list) console.log(String(r.kb).padStart(7), 'KB  t+'+String(r.start).padStart(5)+'ms ', r.n);
// Which of these actually contain three.js?
const html = await p.content();
console.log('\npreload/prefetch link tags in HTML:', (html.match(/rel="(preload|prefetch|modulepreload)"/g)||[]).length);
await b.close();
