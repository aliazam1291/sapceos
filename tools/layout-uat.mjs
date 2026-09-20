// Who is forcing layout while the page scrolls? A CPU profile blames the
// first function that *reads* layout after someone else dirtied it (the
// scroll sampler, every time), which is the wrong culprit. This records a
// Chrome trace with stack traces on Layout / UpdateLayoutTree and the
// invalidation-tracking events — which say what dirtied layout and why —
// across one reading-pace scroll, and aggregates by initiator.
//
//   CHROME=1 node tools/layout-uat.mjs /            (BASE=http://localhost:3210)
//   CHROME=1 MOBILE=1 node tools/layout-uat.mjs /   (412×823, touch)
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const route = process.argv[2] ?? '/';
const mobile = !!process.env.MOBILE;
const b = await chromium.launch(process.env.CHROME ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--headless=new'] } : {});
const ctx = await b.newContext(mobile ? { viewport: { width: 412, height: 823 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.addInitScript(() => sessionStorage.setItem('space-os:booted', '1'));
await p.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
await p.waitForTimeout(3500);

const cdp = await ctx.newCDPSession(p);
const events = [];
cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
const done = new Promise((res) => cdp.on('Tracing.tracingComplete', res));
await cdp.send('Tracing.start', {
  traceConfig: {
    includedCategories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-devtools.timeline.invalidationTracking',
      'blink.animations',
      'disabled-by-default-v8.cpu_profiler',
    ],
  },
  transferMode: 'ReportEvents',
});
const scroll = await p.evaluate(
  () =>
    new Promise((res) => {
      const H = document.documentElement.scrollHeight - innerHeight;
      const t0 = performance.now();
      const dur = Math.min(14000, Math.max(3000, (H / 1100) * 1000));
      let frames = 0;
      const f = (now) => {
        frames++;
        const k = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, H * k);
        if (k < 1) requestAnimationFrame(f);
        else res({ dur: Math.round(dur), frames });
      };
      requestAnimationFrame(f);
    }),
);
await cdp.send('Tracing.end');
await done;

const frameKey = (f) => `${f.functionName || '(anon)'} @ ${String(f.url).split('/').pop().slice(0, 26)}:${f.lineNumber}:${f.columnNumber}`;
const agg = (name, pick) => {
  const m = new Map();
  let total = 0;
  let n = 0;
  for (const e of events) {
    if (e.name !== name || e.ph !== 'X') continue;
    n++;
    total += e.dur / 1000;
    const k = pick(e) ?? '(no stack — not forced by script)';
    const cur = m.get(k) ?? { ms: 0, n: 0 };
    cur.ms += e.dur / 1000;
    cur.n++;
    m.set(k, cur);
  }
  return { n, total, rows: [...m.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 12) };
};
const stackTop = (e) => {
  const st = e.args?.beginData?.stackTrace;
  if (!st?.length) return null;
  // First frame that is the site's own code, else the top frame.
  const own = st.find((f) => /_next\/static/.test(f.url) && !/framework|main-app|webpack/.test(f.url));
  return frameKey(own ?? st[0]);
};

console.log(`${route} scrolled ${scroll.dur}ms over ${scroll.frames} frames (${Math.round(scroll.frames / (scroll.dur / 1000))} fps)`);
for (const name of ['Layout', 'UpdateLayoutTree', 'HitTest']) {
  const { n, total, rows } = agg(name, stackTop);
  console.log(`\n${name}: ${n} events, ${Math.round(total)}ms total`);
  for (const [k, v] of rows) console.log(String(Math.round(v.ms)).padStart(6), String(v.n).padStart(5), k);
}

// What dirtied layout / style, by reason and node.
const inval = new Map();
for (const e of events) {
  if (!/InvalidationTracking$/.test(e.name)) continue;
  const d = e.args?.data ?? {};
  const st = d.stackTrace;
  const own = st?.find((f) => /_next\/static/.test(f.url) && !/framework|main-app|webpack/.test(f.url)) ?? st?.[0];
  const k = `${e.name.replace('InvalidationTracking', '')} · ${d.reason ?? d.invalidatedSelectorId ?? ''} · <${d.nodeName ?? '?'}> · ${own ? frameKey(own) : '(no stack)'}`;
  inval.set(k, (inval.get(k) ?? 0) + 1);
}
console.log('\ninvalidations (count · kind · reason · node · initiator):');
for (const [k, n] of [...inval.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)) console.log(String(n).padStart(6), k);

// Which CSS animations run on the main thread, and why Blink would not
// composite them (the Animation trace events carry the failure reasons).
const REASONS = ['AcceleratedAnimationsDisabled', 'EffectSuppressedByDevtools', 'InvalidAnimationOrEffect', 'EffectHasUnsupportedTimingParameters', 'EffectHasNonReplaceCompositeMode', 'TargetHasInvalidCompositingState', 'TargetHasIncompatibleAnimations', 'TargetHasCSSOffset', 'AnimationAffectsNonCSSProperties', 'TransformRelatedPropertyCannotBeAcceleratedOnTarget', 'TransformRelatedPropertyDependsOnBoxSize', 'FilterRelatedPropertyMayMovePixels', 'UnsupportedCSSProperty', 'MixedKeyframeValueTypes', 'TimelineSourceHasInvalidCompositingState', 'AnimationHasNoVisibleChange', 'AffectsImportantProperty', 'SVGTargetHasIndependentTransformProperty'];
// The events carry a backend node id, not a name: resolve them through the
// DOM domain so the table names the element and its class.
const nodeNames = new Map();
{
  const ids = [...new Set(events.filter((e) => e.name === 'Animation' && e.args?.data?.compositeFailed && e.args.data.nodeId).map((e) => e.args.data.nodeId))];
  if (ids.length) {
    try {
      await cdp.send('DOM.enable');
      await cdp.send('DOM.getDocument', { depth: 0 });
      const { nodeIds } = await cdp.send('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds: ids });
      for (let i = 0; i < ids.length; i++) {
        if (!nodeIds[i]) continue;
        try {
          const { node } = await cdp.send('DOM.describeNode', { nodeId: nodeIds[i] });
          const attrs = node.attributes ?? [];
          const cls = attrs[attrs.indexOf('class') + 1];
          nodeNames.set(ids[i], `<${node.localName || node.nodeName}${cls && attrs.indexOf('class') >= 0 ? ' .' + cls.split(' ').map((c) => c.replace(/^.*__/, '')).join('.') : ''}>`);
        } catch {}
      }
    } catch {}
  }
}
const anims = new Map();
for (const e of events) {
  if (e.name !== 'Animation' || !e.args?.data) continue;
  const d = e.args.data;
  if (!d.compositeFailed) continue;
  const why = REASONS.filter((_, i) => d.compositeFailed & (1 << i)).join('+') || `0x${d.compositeFailed.toString(16)}`;
  const k = `${nodeNames.get(d.nodeId) ?? `<${d.nodeName ?? '?'}>`} ${d.displayName ?? d.name ?? ''} · ${why} (0x${d.compositeFailed.toString(16)})${d.unsupportedProperties?.length ? ' · ' + d.unsupportedProperties.join(',') : ''}`;
  anims.set(k, (anims.get(k) ?? 0) + 1);
}
if (anims.size) {
  console.log('\nmain-thread animations (not composited), count · node · animation · reason:');
  for (const [k, n] of [...anims.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(String(n).padStart(6), k);
}

// Long tasks and their top script frame, from the same trace.
const tasks = events.filter((e) => e.name === 'RunTask' && e.ph === 'X' && e.dur > 50000).sort((a, b) => b.dur - a.dur).slice(0, 8);
if (tasks.length) {
  console.log('\nlong tasks (>50ms) in the scroll:');
  for (const t of tasks) {
    const inside = events.filter((e) => e.ph === 'X' && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.tid === t.tid && /^(FunctionCall|Layout|UpdateLayoutTree|Paint|EvaluateScript|TimerFire|Animation|ParseHTML|EventDispatch|RequestAnimationFrame|FireAnimationFrame|HitTest|Commit|Compile)/.test(e.name));
    const by = new Map();
    for (const e of inside) by.set(e.name, (by.get(e.name) ?? 0) + e.dur / 1000);
    const fn = inside.filter((e) => e.name === 'FunctionCall' && e.args?.data?.functionName).sort((a, b) => b.dur - a.dur)[0]?.args.data;
    console.log(`${String(Math.round(t.dur / 1000)).padStart(6)}ms  ${[...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v)}`).join(' · ')}${fn ? ` · fn ${fn.functionName} @ ${String(fn.url).split('/').pop().slice(0, 22)}:${fn.lineNumber}` : ''}`);
  }
}
await b.close();
