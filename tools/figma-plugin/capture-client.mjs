// HD captures of a client's live site for a Behance case study.
//   node tools/figma-plugin/capture-client.mjs https://www.sundermasala.com sunder
// Writes shots/<key>/d-00.jpg… (desktop viewport frames down the home page),
// shots/<key>/m-00.jpg… (phone), shots/<key>/p-<slug>.jpg (inner pages), and
// shots/<key>/links.json (same-site links found on the home page).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [site, key, ...pages] = process.argv.slice(2);
const out = path.join(here, "shots", key);
fs.mkdirSync(path.join(out, "d"), { recursive: true }); fs.mkdirSync(path.join(out, "m"), { recursive: true });

async function frames(browser, viewport, mobile, prefix, max) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(site, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(3000);
  // decline the cookie banner (privacy-preserving choice) so it is not in every frame
  await p.getByRole("button", { name: /don.?t allow|decline|reject/i }).first().click({ timeout: 4000 }).catch(() => {});
  // walk the page once so lazy content and reveal animations fire
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  let i = 0;
  for (let y = 0; y < total && i < max; y += viewport.height, i++) {
    await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(out, `${prefix}/${prefix}-${String(i).padStart(2, "0")}.jpg`), type: "jpeg", quality: 88, timeout: 90000 });
  }
  if (!mobile) {
    const links = await p.evaluate((origin) => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href.split("#")[0]).filter((h) => h.startsWith(origin)))], new URL(site).origin);
    fs.writeFileSync(path.join(out, "links.json"), JSON.stringify(links, null, 1));
    const imgs = await p.evaluate(() => [...document.querySelectorAll("img")].map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt })).filter((i) => i.w > 200));
    fs.writeFileSync(path.join(out, "images.json"), JSON.stringify(imgs, null, 1));
  }
  console.log(prefix, i, "frames of", total);
  await ctx.close();
}

async function inner(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  for (const u of pages) {
    await p.goto(u, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(3000);
    const slug = new URL(u).pathname.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home";
    await p.screenshot({ path: path.join(out, `p-${slug}.jpg`), type: "jpeg", quality: 88, timeout: 90000 });
    console.log("page", slug);
  }
  await ctx.close();
}

const browser = await chromium.launch({ channel: "chrome" });
if (pages.length) await inner(browser);
else {
  await frames(browser, { width: 1440, height: 900 }, false, "d", 14);
  await frames(browser, { width: 390, height: 844 }, true, "m", 10);
}
await browser.close();
