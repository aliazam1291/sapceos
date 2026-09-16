/*
 * Hero chrome check: the status line pins top-left, the scroll hint
 * bottom-left, the map badge bottom-right and clear of the section rail, and
 * none of them overlap. Writes a screenshot for eyeballing.
 *
 *   node tools/herochrome-uat.mjs [out.png]     (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const out = process.argv[2] ?? "tools/shots/hero-chrome.png";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// The launch sequence shows once per session; harnesses skip it.
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(4500);

const rects = await p.evaluate(() => {
  const r = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right), b: Math.round(b.bottom) };
  };
  return {
    viewport: { w: innerWidth, h: innerHeight },
    hero: r("#arrival"),
    label: r("[class*=heroLabel]"),
    badge: r("[class*=heroStageBadge]"),
    scroll: r("[class*=scrollHint]"),
    rail: r("[class*=SectionGuide] , aside[class*=guide], [class*=sectionGuide]"),
    canvas: r("#arrival canvas"),
    h1: document.querySelector("h1")?.textContent?.slice(0, 60),
  };
});

const overlaps = (a, c) => a && c && !(a.r <= c.x || c.r <= a.x || a.b <= c.y || c.b <= a.y);
const issues = [];
if (!rects.label || rects.label.y > 120) issues.push("status line not at top");
if (!rects.scroll || rects.scroll.b < rects.hero.b - 160) issues.push("scroll hint not at bottom");
if (!rects.badge || rects.badge.b < rects.hero.b - 160) issues.push("badge not at bottom");
if (overlaps(rects.badge, rects.scroll)) issues.push("badge overlaps scroll hint");
if (rects.badge && rects.badge.r > rects.viewport.w - 80) issues.push("badge too close to the right edge / rail");
if (!rects.canvas || rects.canvas.w < rects.viewport.w * 0.95) issues.push("galaxy canvas does not span the frame");

await p.screenshot({ path: out });
console.log(JSON.stringify(rects, null, 2));
console.log(issues.length ? "ISSUES:\n - " + issues.join("\n - ") : "OK: chrome pinned to corners, galaxy full-frame");
console.log("wrote", out);
await b.close();
