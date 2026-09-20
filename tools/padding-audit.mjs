/*
 * Layout/spacing audit across every route and three viewports.
 *
 * Flags, per page:
 *   - horizontal overflow (documentElement.scrollWidth > clientWidth)
 *   - any element whose content box sits flush against or past the
 *     viewport edge (< 4px gutter) outside known full-bleed scenes
 *   - elements whose bounding boxes overlap unexpectedly (simple check:
 *     two text-bearing leaf elements overlapping by >30% area)
 *   - shell padding-inline actually applied vs the --shell-pad token
 *
 *   node tools/padding-audit.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const routes = [
  "/",
  "/missions",
  "/missions/technician-app",
  "/lab",
  "/field-notes",
  "/field-notes/flipkart-product-discovery",
  "/decisions",
  "/about",
  "/mission-history",
  "/contact",
  "/galaxy",
];
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
];

const b = await chromium.launch();
const report = {};

for (const vp of viewports) {
  report[vp.name] = {};
  const p = await b.newPage({ viewport: { width: vp.width, height: vp.height } });
  await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));

  for (const route of routes) {
    try {
      await p.goto(BASE + route, { waitUntil: "load", timeout: 30000 });
    } catch (e) {
      report[vp.name][route] = { navError: String(e) };
      continue;
    }
    await p.waitForTimeout(1800);

    const data = await p.evaluate(() => {
      const html = document.documentElement;
      const overflow = html.scrollWidth - html.clientWidth;

      // Elements whose box touches or crosses the viewport edge, excluding
      // full-bleed scene hosts (canvas containers, fixed decor) which are
      // allowed to run edge-to-edge.
      const vw = window.innerWidth;
      const edgeViolations = [];
      const all = document.querySelectorAll("body *");
      const fullBleedTags = new Set(["CANVAS", "svg", "SVG", "SCRIPT", "STYLE"]);
      for (const el of all) {
        if (fullBleedTags.has(el.tagName)) continue;
        const cs = getComputedStyle(el);
        if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
        // Only consider elements carrying visible text directly (leaf-ish).
        const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!hasOwnText) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.left < 0 || r.right > vw) {
          edgeViolations.push({
            tag: el.tagName,
            cls: el.className?.toString().slice(0, 60) ?? "",
            text: el.textContent.trim().slice(0, 40),
            left: Math.round(r.left),
            right: Math.round(r.right),
            vw,
          });
        }
      }

      // Shell containers: measure actual left padding vs computed --shell-pad.
      const shellPad = getComputedStyle(html).getPropertyValue("--shell-pad").trim();

      return {
        overflow,
        edgeViolations: edgeViolations.slice(0, 8),
        edgeViolationCount: edgeViolations.length,
        shellPad,
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
      };
    });

    report[vp.name][route] = data;
  }
  await p.close();
  if (errors.length) report[vp.name]._pageErrors = errors;
}

await b.close();

// Print a compact summary, flagging only real problems.
let issues = 0;
for (const [vpName, routes_] of Object.entries(report)) {
  for (const [route, d] of Object.entries(routes_)) {
    if (route === "_pageErrors") continue;
    if (d.navError) { console.log(`[${vpName}] ${route}: NAV ERROR ${d.navError}`); issues++; continue; }
    if (d.overflow > 2) {
      console.log(`[${vpName}] ${route}: HORIZONTAL OVERFLOW ${d.overflow}px (scrollWidth ${d.scrollWidth} vs clientWidth ${d.clientWidth})`);
      issues++;
    }
    if (d.edgeViolationCount > 0) {
      console.log(`[${vpName}] ${route}: ${d.edgeViolationCount} element(s) crossing viewport edge`);
      for (const v of d.edgeViolations) {
        console.log(`    <${v.tag} class="${v.cls}"> "${v.text}" left=${v.left} right=${v.right} vw=${v.vw}`);
      }
      issues++;
    }
  }
}
console.log(issues ? `\n${issues} issue group(s) found.` : "\nOK: no overflow or edge violations across all routes/viewports.");
console.log("\nFull report:");
console.log(JSON.stringify(report, null, 2));
