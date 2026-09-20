// Lighthouse across every route, desktop and mobile, against the PRODUCTION
// server — dev numbers for bundle weight, LCP and TBT are meaningless.
//
//   $env:BUILD_DIR=".next-prod"; npx next build; npx next start -p 3210
//   node tools/lighthouse-uat.mjs
//   ROUTES=/,/missions FORMS=mobile node tools/lighthouse-uat.mjs
//
// Prints a score table plus every failing audit per route, and writes each
// report to tools/shots/lh/<route>.<form>.json. Needs `lighthouse` (a dev
// dependency) and a Chrome; CHROME overrides the path.
//
// Three traps found 2026-09-19/20: (1) the desktop app's browser pane shares the
// iGPU with the audited page — park it on a blank page or a TBT of 2 s reads
// as 13 s; (2) local headless Chrome uses the real GPU (ANGLE D3D11), while
// PageSpeed's servers run SwiftShader, so `perf.software` only triggers there;
// (3) a run that seems slow may be sharing the GPU with a Chrome a previous run
// leaked — check `Get-Process chrome` for --headless=new before trusting it.
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const routes = (
  process.env.ROUTES ??
  '/,/missions,/missions/vahan-shakti,/field-notes,/field-notes/linear-vs-jira,/lab,/about,/decisions,/mission-history,/contact'
).split(',');
const forms = (process.env.FORMS ?? 'desktop,mobile').split(',');
const OUT = 'tools/shots/lh/';
fs.mkdirSync(OUT, { recursive: true });

const chrome = await launch({
  chromePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  chromeFlags: ['--headless=new', '--no-first-run'],
});

const rows = [];
const fails = {};
for (const route of routes) {
  for (const form of forms) {
    const opts = {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: form,
      screenEmulation:
        form === 'desktop'
          ? { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false }
          : { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
      throttlingMethod: 'simulate',
      throttling:
        form === 'desktop'
          ? { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 }
          : { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    };
    let r;
    try {
      r = await lighthouse(BASE + route, opts);
    } catch (e) {
      rows.push({ route, form, err: String(e).slice(0, 80) });
      continue;
    }
    const { lhr } = r;
    const c = lhr.categories;
    const a = lhr.audits;
    rows.push({
      route,
      form,
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c['best-practices'].score * 100),
      seo: Math.round(c.seo.score * 100),
      LCP: a['largest-contentful-paint']?.displayValue,
      TBT: a['total-blocking-time']?.displayValue,
      CLS: a['cumulative-layout-shift']?.displayValue,
      SI: a['speed-index']?.displayValue,
    });
    fails[`${route} [${form}]`] = Object.values(a)
      .filter((x) => x.score !== null && x.score < 0.9 && !['informative', 'notApplicable', 'manual'].includes(x.scoreDisplayMode))
      .map((x) => `${x.id} (${x.score}) ${x.displayValue ?? ''}`.trim());
    fs.writeFileSync(`${OUT}${route.replace(/\//g, '_') || '_root'}.${form}.json`, JSON.stringify(lhr));
  }
}
console.table(rows);
for (const [k, v] of Object.entries(fails)) if (v.length) console.log(`\n${k}\n  ` + v.join('\n  '));

// Shut Chrome down ourselves and exit. chrome-launcher's kill() throws EBUSY
// on Windows while deleting its temp profile and — worse — can hang with the
// browser still running: ten headless instances, each with a GPU process,
// were found alive from earlier runs on 2026-09-20, and every reading taken
// while they lived was noisy. Kill the tree, then leave; the profile dir in
// %TEMP% is a few MB and harmless.
try {
  if (process.platform === 'win32') execSync(`taskkill /PID ${chrome.pid} /T /F`, { stdio: 'ignore' });
  else chrome.process.kill('SIGKILL');
} catch {}
setTimeout(() => process.exit(0), 300);
