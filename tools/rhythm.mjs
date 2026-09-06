import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewportSize: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} window.scrollTo(0,0); });
await p.waitForTimeout(1500);
const rows = await p.evaluate(() => [...document.querySelectorAll('section')].map(s => {
  const r = s.getBoundingClientRect(); const cs = getComputedStyle(s);
  return { id: s.id || s.dataset.section || '(none)', h: Math.round(r.height),
           pt: Math.round(parseFloat(cs.paddingTop)), pb: Math.round(parseFloat(cs.paddingBottom)) };
}));
const vh = 900;
for (const r of rows) console.log(`${r.id.padEnd(18)} height=${String(r.h).padStart(5)}px (${(r.h/vh).toFixed(1)} screens)  pad ${r.pt}/${r.pb}`);
console.log('total doc height:', await p.evaluate(() => document.body.scrollHeight), 'px');
await b.close();
