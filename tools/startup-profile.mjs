// Where the home page's startup JavaScript goes, by SOURCE FILE.
//
//   $env:BUILD_DIR=".next-prof"; $env:SOURCEMAPS="1"; npx next build
//   $env:BUILD_DIR=".next-prof"; npx next start -p 3211
//   node tools/startup-profile.mjs            (BASE, ROUTE, MS, CPU, BOOT=1, SWGL=1)
//
// Loads the page in real Chrome with the CPU slowed CPU× (default 4, as
// Lighthouse mobile does), samples the main thread for MS ms, and maps every
// sample through the chunk's source map to the file that owns it. Prints
// self time per source file and the long-task total, so a change to the
// first load can be measured by file rather than guessed (2026-11-20).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { SourceMapConsumer } from "source-map";

const BASE = process.env.BASE ?? "http://localhost:3211";
const ROUTE = process.env.ROUTE ?? "/";
const MS = Number(process.env.MS ?? 6000);
const CPU = Number(process.env.CPU ?? 4);
const DIST = process.env.BUILD_DIR ?? ".next-prof";

const b = await chromium.launch({
  channel: "chrome",
  args: process.env.SWGL ? ["--use-angle=swiftshader", "--use-gl=angle", "--enable-unsafe-swiftshader"] : [],
});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
if (!process.env.BOOT) await ctx.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await ctx.addInitScript(() => {
  window.__lt = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: "longtask", buffered: true });
});
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
await cdp.send("Profiler.start");
await p.goto(BASE + ROUTE, { waitUntil: "load" });
await p.waitForTimeout(MS);
const { profile } = await cdp.send("Profiler.stop");
const lt = await p.evaluate(() => window.__lt);
await b.close();

const blocked = lt.reduce((s, [, d]) => s + Math.max(0, d - 50), 0);
console.log(`long tasks ${lt.length}, blocked ${Math.round(blocked)} ms (CPU ×${CPU}, ${MS} ms, boot ${process.env.BOOT ? "on" : "skipped"})`);

const consumers = new Map();
async function consumerFor(url) {
  if (consumers.has(url)) return consumers.get(url);
  let c = null;
  const m = url.match(/\/_next\/(static\/chunks\/[^?]+\.js)/);
  if (m) {
    // Turbopack names a chunk's map differently from the chunk: follow the
    // chunk's own sourceMappingURL comment.
    const js = path.join(DIST, m[1]);
    const ref = fs.existsSync(js) ? fs.readFileSync(js, "utf8").match(/\/\/# sourceMappingURL=(\S+)\s*$/) : null;
    const file = ref ? path.join(path.dirname(js), ref[1]) : null;
    if (file && fs.existsSync(file)) c = await new SourceMapConsumer(JSON.parse(fs.readFileSync(file, "utf8")));
  }
  consumers.set(url, c);
  return c;
}
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
for (let i = 0; i < profile.samples.length; i++) {
  const n = byId.get(profile.samples[i]);
  const ms = (profile.timeDeltas[i] ?? 0) / 1000;
  const f = n.callFrame;
  let key = f.url ? f.url.split("/").pop() : f.functionName || "(native)";
  const c = f.url ? await consumerFor(f.url) : null;
  if (c) {
    const o = c.originalPositionFor({ line: f.lineNumber + 1, column: f.columnNumber });
    if (o.source) key = o.source.replace(/^.*?(node_modules\/(@[^/]+\/)?[^/]+|src\/.*)$/, "$1");
  }
  if (!f.url && /^\((idle|program|garbage collector)\)$/.test(f.functionName)) key = f.functionName;
  self.set(key, (self.get(key) ?? 0) + ms);
}
for (const [k, v] of [...self].sort((a, z) => z[1] - a[1]).slice(0, Number(process.env.TOP ?? 30))) console.log(`${Math.round(v).toString().padStart(6)} ms  ${k}`);
