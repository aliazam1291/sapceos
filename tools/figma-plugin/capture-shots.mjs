// Capture the LIVE site for the Figma file's "Live site" board, then bundle
// the shots into the plugin (tools/figma-plugin/plugin.js = shots + code.js),
// so the plugin needs no network access and no Figma API uploads.
//
//   node tools/figma-plugin/capture-shots.mjs
//
// Real Chrome (the GPU, so the WebGL scenes render as visitors see them).
// The launch screen is skipped with the session flag the harnesses use.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE || "https://aliazamkazmi.vercel.app";
const out = path.join(here, "shots");
fs.mkdirSync(out, { recursive: true });

// [key, path, scroll target (#id or null), caption]
const DESK = [
  ["home-hero", "/", null, "Home · the landing"],
  ["home-work", "/", "#arrival", "Home · selected work, the galaxy flight"],
  ["home-results", "/", "#debrief", "Home · results, every result has mass"],
  ["home-contact", "/", "#landing", "Home · contact, the landing pad"],
  ["hire", "/hire", null, "For recruiters"],
  ["missions", "/missions", null, "Projects"],
  ["report", "/missions/mappls-shop-admin", null, "Project report · Mappls Shop"],
  ["about", "/about", null, "About"],
  ["studio", "/studio", null, "Design work · Smaak.ux"],
  ["contact", "/contact", null, "Contact"],
];
const PHONE = [
  ["m-home", "/", null, "Home"],
  ["m-hire", "/hire", null, "For recruiters"],
  ["m-missions", "/missions", null, "Projects"],
  ["m-contact", "/contact", null, "Contact"],
];

async function shoot(browser, list, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
  const p = await ctx.newPage();
  const meta = [];
  let current = "";
  for (const [key, route, target, caption] of list) {
    if (route !== current) { await p.goto(SITE + route, { waitUntil: "load", timeout: 90000 }); await p.waitForTimeout(6000); current = route; }
    if (target) {
      await p.evaluate((sel) => { const el = document.querySelector(sel); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (sel === "#arrival" ? innerHeight * 0.6 : 0)); }, target);
      await p.waitForTimeout(8000);
    } else {
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(1500);
    }
    const file = path.join(out, key + ".jpg");
    await p.screenshot({ path: file, type: "jpeg", quality: 72 });
    meta.push({ key, url: SITE + route, caption, w: viewport.width, h: viewport.height, mobile });
    console.log("shot", key, Math.round(fs.statSync(file).size / 1024) + " KB");
  }
  await ctx.close();
  return meta;
}

// `--bundle` re-bundles code.js with the shots already on disk (after an
// edit to code.js), without capturing again.
let meta;
if (process.argv.includes("--bundle")) {
  meta = JSON.parse(fs.readFileSync(path.join(out, "meta.json"), "utf8"));
} else {
  const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-size=1480,1000"] });
  meta = [...(await shoot(browser, DESK, { width: 1440, height: 900 }, false)), ...(await shoot(browser, PHONE, { width: 390, height: 844 }, true))];
  await browser.close();
  fs.writeFileSync(path.join(out, "meta.json"), JSON.stringify(meta, null, 1));
}

// Bundle: SHOTS = [{ key, url, caption, w, h, mobile, b64 }] ahead of code.js.
const shots = meta.map((m) => ({ ...m, b64: fs.readFileSync(path.join(out, m.key + ".jpg")).toString("base64") }));
const code = fs.readFileSync(path.join(here, "code.js"), "utf8");
fs.writeFileSync(path.join(here, "plugin.js"), "const SHOTS = " + JSON.stringify(shots) + ";\n" + code);
console.log("plugin.js", Math.round(fs.statSync(path.join(here, "plugin.js")).size / 1024) + " KB");
