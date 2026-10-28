import { expect, test, type APIRequestContext } from "@playwright/test";

/*
 * What a crawler sees, route by route: no browser, just the HTML the server
 * sends. Every URL in the sitemap must be a 200 with one h1, a title and
 * description that fit the snippet, a canonical to itself, an OG image,
 * JSON-LD that parses, and no noindex.
 */

async function sitemapPaths(request: APIRequestContext) {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

const attr = (tag: string | undefined, name: string) => tag?.match(new RegExp(`${name}=["']([^"']*)["']`))?.[1];
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

test("every sitemap route is indexable and well formed", async ({ request }) => {
  const paths = await sitemapPaths(request);
  expect(paths.length).toBeGreaterThan(30);
  const problems: string[] = [];

  for (const path of paths) {
    const res = await request.get(path, { maxRedirects: 0 });
    if (res.status() !== 200) {
      problems.push(`${path}: HTTP ${res.status()}`);
      continue;
    }
    const html = await res.text();
    const robotsHeader = res.headers()["x-robots-tag"] ?? "";
    const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "");
    const desc = decode(attr(html.match(/<meta[^>]+name="description"[^>]*>/)?.[0], "content") ?? "");
    const canonical = attr(html.match(/<link[^>]+rel="canonical"[^>]*>/)?.[0], "href");
    const robotsMeta = attr(html.match(/<meta[^>]+name="robots"[^>]*>/)?.[0], "content") ?? "";
    const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);

    if (/noindex/i.test(robotsMeta + robotsHeader)) problems.push(`${path}: noindex`);
    if (!title || title.length > 65) problems.push(`${path}: title ${title.length} chars "${title}"`);
    if (/…$/.test(title)) problems.push(`${path}: title clipped "${title}"`);
    if (desc.length < 70 || desc.length > 165) problems.push(`${path}: description ${desc.length} chars`);
    if (!canonical || new URL(canonical).pathname.replace(/\/$/, "") !== path.replace(/\/$/, "")) problems.push(`${path}: canonical ${canonical}`);
    if (!/<meta[^>]+property="og:image"/.test(html)) problems.push(`${path}: no og:image`);
    if (h1 !== 1) problems.push(`${path}: ${h1} h1`);
    if (lds.length === 0) problems.push(`${path}: no JSON-LD`);
    for (const ld of lds) {
      try {
        JSON.parse(ld);
      } catch {
        problems.push(`${path}: JSON-LD does not parse`);
      }
    }
    if (/\[DRAFT|>undefined<|NaN/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) problems.push(`${path}: leaked DRAFT/undefined/NaN`);
  }
  expect(problems).toEqual([]);
});

test("titles and descriptions are not duplicated across pages", async ({ request }) => {
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const path of await sitemapPaths(request)) {
    const html = await (await request.get(path)).text();
    for (const key of [
      "title:" + (html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""),
      "desc:" + (attr(html.match(/<meta[^>]+name="description"[^>]*>/)?.[0], "content") ?? ""),
    ]) {
      if (seen.has(key)) dupes.push(`${path} repeats ${seen.get(key)}: ${key.slice(0, 80)}`);
      else seen.set(key, path);
    }
  }
  expect(dupes).toEqual([]);
});

test("robots, sitemap, feed and llms.txt are served as what they are", async ({ request }) => {
  const types: Record<string, RegExp> = {
    "/robots.txt": /text\/plain/,
    "/sitemap.xml": /xml/,
    "/feed.xml": /xml/,
    "/llms.txt": /text\/plain/,
    "/manifest.webmanifest": /json/,
  };
  for (const [path, type] of Object.entries(types)) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()["content-type"], path).toMatch(type);
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
  expect(robots).not.toMatch(/Disallow: \/\s*$/m);
});

test("a page that does not exist is a real 404", async ({ request }) => {
  const res = await request.get("/definitely-not-a-page");
  expect(res.status()).toBe(404);
  expect(await res.text()).toMatch(/<meta[^>]+name="robots"[^>]+noindex/);
});

test("old URLs answer in one permanent hop", async ({ request }) => {
  const hops: [string, string][] = [
    ["/case-studies/uber-driver-retention", "/field-notes/uber-driver-retention"],
    ["/case-studies", "/field-notes"],
    ["/blog", "/writing"],
    ["/work", "/missions"],
    ["/projects/no-such-project", "/missions"],
    ["/smaak-ux", "/smaak"],
  ];
  for (const [from, to] of hops) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect([301, 308], from).toContain(res.status());
    expect(new URL(res.headers().location, "http://x").pathname, from).toBe(to);
    const landed = await request.get(to, { maxRedirects: 0 });
    expect(landed.status(), `${from} → ${to}`).toBe(200);
  }
});

test("the résumé is one click away", async ({ request }) => {
  const res = await request.get("/resume");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/pdf/);
});
