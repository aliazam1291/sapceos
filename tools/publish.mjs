// Publish a hosted piece: flip its status in src/content/writing.ts from
// "draft" to "published", commit, push (Vercel deploys main), wait for the
// page to be live, then tell IndexNow about the new URL and the /writing log.
//
//   node tools/publish.mjs prds-as-an-engineer
//   node tools/publish.mjs prds-as-an-engineer --date 2026-09-22   (set the date to today)
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node tools/publish.mjs <slug> [--date YYYY-MM-DD]');
  process.exit(1);
}
const dateArg = process.argv.indexOf('--date');
const date = dateArg > -1 ? process.argv[dateArg + 1] : null;

const file = 'src/content/writing.ts';
let s = fs.readFileSync(file, 'utf8');
const at = s.indexOf(`slug: "${slug}"`);
if (at < 0) {
  console.error(`no piece with slug "${slug}"`);
  process.exit(1);
}
// The status line belongs to the same object: search forward from the slug to the next "status:".
const statusAt = s.indexOf('status: "draft"', at);
const nextSlug = s.indexOf('slug: "', at + 10);
if (statusAt < 0 || (nextSlug > -1 && statusAt > nextSlug)) {
  console.error(`"${slug}" is not a draft`);
  process.exit(1);
}
s = s.slice(0, statusAt) + 'status: "published"' + s.slice(statusAt + 'status: "draft"'.length);
if (date) {
  const dateAt = s.lastIndexOf('date: "', at);
  s = s.slice(0, dateAt) + `date: "${date}"` + s.slice(s.indexOf('"', dateAt + 7) + 1);
}
fs.writeFileSync(file, s);
console.log(`published ${slug}${date ? ` dated ${date}` : ''}`);

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
run(`git add ${file}`);
run(`git commit -q -m "Publish: ${slug}"`);
run('git push origin main');

const url = `https://${process.env.SITE_HOST ?? 'aliazamkazmi.vercel.app'}/writing/${slug}`;
process.stdout.write(`waiting for ${url} `);
for (let i = 0; i < 40; i++) {
  const res = await fetch(url, { method: 'HEAD' }).catch(() => null);
  if (res?.ok) {
    console.log('\nlive');
    run(`node tools/indexnow.mjs /writing/${slug} /writing /sitemap.xml`);
    process.exit(0);
  }
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 15000));
}
console.log('\nnot live after 10 minutes — run `node tools/indexnow.mjs /writing/' + slug + '` once it is');
