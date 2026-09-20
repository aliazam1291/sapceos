// Tell IndexNow-capable engines (Bing, Yandex, Naver, Seznam — and through
// Bing, Copilot and DuckDuckGo's upstream) which URLs changed. One POST with
// every URL in the live sitemap; the key is proven by public/<key>.txt.
//
//   node tools/indexnow.mjs                      (all sitemap URLs)
//   node tools/indexnow.mjs /writing /dumbmoney  (just these paths)
const HOST = process.env.SITE_HOST ?? 'aliazamkazmi.vercel.app';
const KEY = '9f8cbb61bf170ec49c6377f295f669b5';
const base = 'https://' + HOST;
let urls = process.argv.slice(2).map((p) => base + p);
if (!urls.length) {
  const xml = await (await fetch(base + '/sitemap.xml')).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const keyOk = (await fetch(`${base}/${KEY}.txt`)).ok;
if (!keyOk) {
  console.error(`key file not live yet: ${base}/${KEY}.txt — deploy first`);
  process.exit(1);
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${base}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow ${res.status} ${res.statusText} — ${urls.length} URLs submitted`);
