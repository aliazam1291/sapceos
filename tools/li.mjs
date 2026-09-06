import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({
  viewport:{width:1280,height:900},
  userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
});
const r = await p.goto('https://www.linkedin.com/in/ali-azam-kazmi', { waitUntil:'domcontentloaded', timeout:45000 }).catch(e=>({status:()=>'ERR '+e.message}));
console.log('status:', typeof r?.status === 'function' ? r.status() : r);
await p.waitForTimeout(4000);
const info = await p.evaluate(()=>({
  url: location.href,
  title: document.title.slice(0,90),
  h1: document.querySelector('h1')?.textContent?.trim().slice(0,80) ?? null,
  hasAuthWall: /authwall|login|sign in|join now/i.test(document.body.innerText.slice(0,1200)),
  textStart: document.body.innerText.replace(/\s+/g,' ').slice(0,300),
}));
console.log(JSON.stringify(info,null,1));
await b.close();
