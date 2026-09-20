// The HTML audit, no browser: every route in the sitemap (plus the 404),
// fetched from the production server and checked for what a crawler and a
// reader both need — status, title and description lengths, one h1,
// canonical, OG image/title, valid JSON-LD, alt text on images, no leaked
// DRAFT markers or "undefined", and every internal link resolving.
//
//   node tools/seo-uat.mjs            (BASE=http://localhost:3210)
const BASE = process.env.BASE ?? 'http://localhost:3210';

const text = async (u) => {
  const r = await fetch(u, { redirect: 'manual' });
  return { status: r.status, body: r.status === 200 ? await r.text() : '', location: r.headers.get('location') };
};

// Routes from the sitemap.
const sm = (await text(`${BASE}/sitemap.xml`)).body;
const routes = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
routes.push('/definitely-not-a-page');
const problems = [];
const links = new Set();

const attr = (tag, name) => tag.match(new RegExp(`${name}=["']([^"']*)["']`))?.[1];
const strip = (s) =>
  s
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

for (const route of routes) {
  const { status, body } = await text(BASE + route);
  const is404 = route === '/definitely-not-a-page';
  if (is404 ? status !== 404 : status !== 200) problems.push(`${route}: HTTP ${status}`);
  if (!body) continue;
  const title = strip(body.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const desc = attr(body.match(/<meta[^>]+name=["']description["'][^>]*>/)?.[0] ?? '', 'content') ?? '';
  const canonical = attr(body.match(/<link[^>]+rel=["']canonical["'][^>]*>/)?.[0] ?? '', 'href');
  const ogImage = body.match(/<meta[^>]+property=["']og:image["'][^>]*>/)?.[0];
  const ogTitle = body.match(/<meta[^>]+property=["']og:title["'][^>]*>/)?.[0];
  const h1s = [...body.matchAll(/<h1[\s>]/g)].length;
  const imgs = [...body.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\salt=/.test(t)).length;
  const lds = [...body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const ld of lds) {
    try {
      JSON.parse(ld);
    } catch (e) {
      problems.push(`${route}: invalid JSON-LD (${String(e).slice(0, 40)})`);
    }
  }
  if (!is404) {
    if (!title) problems.push(`${route}: no <title>`);
    else if (title.length > 65) problems.push(`${route}: title ${title.length} chars — "${title}"`);
    if (!desc) problems.push(`${route}: no meta description`);
    else if (desc.length > 165 || desc.length < 70) problems.push(`${route}: description ${desc.length} chars`);
    if (!canonical) problems.push(`${route}: no canonical`);
    else if (new URL(canonical).pathname.replace(/\/$/, '') !== route.replace(/\/$/, '')) problems.push(`${route}: canonical points to ${canonical}`);
    if (!ogImage) problems.push(`${route}: no og:image`);
    if (!ogTitle) problems.push(`${route}: no og:title`);
    if (h1s !== 1) problems.push(`${route}: ${h1s} <h1>`);
    if (noAlt) problems.push(`${route}: ${noAlt} <img> without alt`);
    if (!lds.length) problems.push(`${route}: no JSON-LD`);
    if (/Needs input|\[DRAFT/.test(strip(body))) problems.push(`${route}: DRAFT marker visible`);
    if (/>undefined<|>NaN<|\bundefined\b(?=[^\w"'])/.test(strip(body))) problems.push(`${route}: "undefined"/"NaN" in copy`);
  }
  for (const m of body.matchAll(/<a[^>]+href=["']([^"'#?]+)["']/g)) {
    const h = m[1];
    if (h.startsWith('/') && !h.startsWith('//')) links.add(h);
  }
}

// Every internal link resolves.
for (const h of [...links].sort()) {
  const r = await fetch(BASE + h, { method: 'HEAD', redirect: 'manual' }).catch(() => null);
  const s = r?.status ?? 0;
  if (s !== 200 && s !== 308 && s !== 307 && s !== 301) problems.push(`link ${h}: HTTP ${s}`);
}

console.log(`${routes.length} routes, ${links.size} internal links`);
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems) console.log('  -', p);
} else console.log('clean');
