// HD captures of the live site for the Behance presentation boards
// (behance-boards.html). 2× device scale, JPEG q90, into shots/hd/.
//   node tools/figma-plugin/capture-hd.mjs
// Real Chrome so the WebGL scenes render with the GPU; launch screen skipped.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE || "https://aliazamkazmi.vercel.app";
const out = path.join(here, "shots", "hd");
fs.mkdirSync(out, { recursive: true });

// [key, route, scroll target, extra offset in viewports, settle ms]
const DESK = [
  ["d-hero", "/", null, 0, 7000],
  ["d-work", "/", "#arrival", 0.6, 9000],
  ["d-results", "/", "#debrief", 0, 8000],
  ["d-log", "/", "#log", 0, 5000],
  ["d-design", "/", "#studio", 0.1, 12000],
  ["d-notes", "/", "#notes", 0.15, 7000],
  ["d-landing", "/", "#landing", 0.1, 9000],
  ["d-hire", "/hire", null, 0, 5000],
  ["d-missions", "/missions", null, 0, 5000],
  ["d-report", "/missions/mappls-shop-admin", null, 0, 5000],
  ["d-studio", "/studio", null, 0, 5000],
  ["d-about", "/about", null, 0, 5000],
];
const PHONE = [
  ["m-hero", "/", null, 0, 6000],
  ["m-work", "/", "#arrival", 0, 6000],
  ["m-results", "/", "#debrief", 0, 6000],
  ["m-hire", "/hire", null, 0, 4000],
  ["m-missions", "/missions", null, 0, 4000],
  ["m-report", "/missions/mappls-shop-admin", null, 0, 4000],
];

async function shoot(browser, list, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
  const p = await ctx.newPage();
  let current = "";
  for (const [key, route, target, extra, settle] of list) {
    if (route !== current) { await p.goto(SITE + route, { waitUntil: "load", timeout: 90000 }); await p.waitForTimeout(5000); current = route; }
    await p.evaluate(([sel, extra]) => {
      const el = sel ? document.querySelector(sel) : null;
      const y = el ? el.getBoundingClientRect().top + scrollY : 0;
      window.scrollTo(0, y + innerHeight * extra);
    }, [target, extra]);
    await p.waitForTimeout(settle);
    const file = path.join(out, key + ".jpg");
    await p.screenshot({ path: file, type: "jpeg", quality: 90 });
    console.log("shot", key, Math.round(fs.statSync(file).size / 1024) + " KB");
  }
  await ctx.close();
}

const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-size=1480,1000"] });
await shoot(browser, DESK, { width: 1440, height: 900 }, false);
await shoot(browser, PHONE, { width: 390, height: 844 }, true);
await browser.close();
