import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const routes = ['/missions/technician-app', '/field-notes/linear-vs-jira'];
let bad = 0;
for (const r of routes) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 150)));
  const resp = await p.goto(BASE + r, { waitUntil: 'domcontentloaded' }).catch(e => ({ status:()=>'ERR '+e.message }));
  await p.waitForTimeout(2500);
  const status = resp?.status ? resp.status() : 'unknown';
  const h1 = await p.evaluate(() => document.querySelector('h1')?.innerText ?? 'MISSING');
  const ok = errs.length === 0;
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + r.padEnd(30), 'status=' + status, 'h1="' + h1 + '"', ok ? '' : errs.slice(0,2).join(' | '));
  await p.screenshot({ path: `tools/shots/dyn-${r.replace(/\//g,'_')}.png` });
  await p.close();
}
console.log(bad ? bad + ' route(s) with errors' : 'dynamic routes clean');
await b.close();
