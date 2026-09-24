/*
 * What the site actually did, from Vercel's Web Analytics API (2026-09-24).
 *
 * Reads VERCEL_TOKEN and VERCEL_PROJECT_ID out of .env.local — the values
 * never appear in this file, in the repo, or in anything printed here. The
 * token is a secret; .env.local is gitignored (.gitignore line 34) and no
 * env file has ever been tracked.
 *
 *   node tools/analytics.mjs            last 7 days
 *   node tools/analytics.mjs 30         last 30 days
 *
 * The three questions worth asking, in order:
 *   1. Did anyone new arrive, and from where.  (referrers, countries)
 *   2. Did they find the work.                 (routes — is /writing on it yet?)
 *   3. Did they do anything.                   (custom events: resume_download,
 *                                               contact_sent, channel, leg_reached)
 *
 * Note on plans: aggregate queries only reach back as far as the plan's
 * reporting window, so a long `days` argument can return less than asked.
 * Count queries have no such limit.
 */
import fs from "node:fs";

// .env.local, parsed here rather than pulling in a dependency.
const envFile = "D:/lap165/Projects/portfolio/.env.local";
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
if (!TOKEN || !PROJECT) {
  console.error(
    "Missing VERCEL_TOKEN or VERCEL_PROJECT_ID.\n" +
      "Add them to .env.local (gitignored):\n" +
      "  VERCEL_TOKEN=...\n" +
      "  VERCEL_PROJECT_ID=prj_...",
  );
  process.exit(1);
}

const days = Number(process.argv[2] ?? 7);
const iso = (d) => d.toISOString().slice(0, 10);
const until = iso(new Date());
const since = iso(new Date(Date.now() - days * 864e5));

// Personal-account project: no teamId. A team project would need one.
async function query(path, params = {}) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${path}`);
  url.searchParams.set("projectId", PROJECT);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) {
    const body = await res.text();
    // Never echo the URL back: it carries the project id, and a future
    // version of this script might carry more.
    throw new Error(`${path} → HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

const rows = (data) => (Array.isArray(data) ? data : []);
const pad = (s, n) => String(s ?? "").padEnd(n);

function table(title, data, key, note = "") {
  console.log(`\n${title}${note ? `  ${note}` : ""}`);
  if (rows(data).length === 0) return console.log("  (nothing)");
  const width = Math.max(...rows(data).map((r) => String(r[key] ?? "—").length), 8);
  for (const r of rows(data)) {
    console.log(`  ${pad(r[key] ?? "—", width)}  ${String(r.visitors ?? r.count ?? 0).padStart(5)} visitors  ${String(r.pageviews ?? "").padStart(5)}`);
  }
}

const range = { since, until };

try {
  console.log(`\nSPACE OS · ${since} → ${until} (${days} days)`);

  const daily = await query("visits/aggregate", { ...range, by: "day" });
  const totalViews = rows(daily.data).reduce((n, r) => n + (r.pageviews ?? 0), 0);
  const totalVisitors = rows(daily.data).reduce((n, r) => n + (r.visitors ?? 0), 0);
  console.log(`\n${totalVisitors} visitors · ${totalViews} page views`);
  console.log("(visitors are summed per day, so a returning reader counts once a day)");

  for (const [title, by, note] of [
    ["ROUTES", "route", "— is /writing on this list yet?"],
    ["REFERRERS", "referrerHostname", ""],
    ["COUNTRIES", "country", ""],
    ["DEVICES", "deviceType", ""],
  ]) {
    const r = await query("visits/aggregate", { ...range, by, limit: 12 });
    table(title, r.data, by, note);
  }

  // The part a dashboard screenshot cannot answer.
  const events = await query("events/aggregate", { ...range, by: "eventName", limit: 20 });
  table("EVENTS", events.data, "eventName", "— what people actually did");
} catch (e) {
  console.error(`\n${e.message}`);
  console.error(
    "\nIf that is a 403: the token may be scoped to a team rather than your personal account,\n" +
      "or it has expired. If it is a 404: check VERCEL_PROJECT_ID against Settings → General.",
  );
  process.exit(1);
}
