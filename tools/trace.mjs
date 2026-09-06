import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:3000', { waitUntil:'domcontentloaded' });
await p.waitForFunction(()=>document.querySelector('[class*=sequence][data-live]'),null,{timeout:25000}).catch(()=>console.log('never went live'));
await p.waitForTimeout(3000);
for (const pct of [10,18,26,34,42,55]) {
  await p.evaluate(v => window.scrollTo({top:(document.body.scrollHeight-innerHeight)*(v/100),behavior:'instant'}), pct);
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const sc = document.querySelector('[class*=MissionSequence][class*=screen], [class*=screen]');
    const st = document.querySelector('[class*=stage]');
    const cv = document.querySelector('[class*=sequence] canvas, [class*=stage] canvas');
    const g = e => { if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.top),Math.round(b.height),getComputedStyle(e).position]; };
    return { y: Math.round(scrollY), screen:g(sc), stage:g(st), canvas:g(cv) };
  });
  console.log(String(pct).padStart(3)+'%', JSON.stringify(r));
}
await b.close();
