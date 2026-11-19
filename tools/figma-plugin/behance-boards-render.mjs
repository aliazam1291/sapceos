// Render each <section> of behance-boards.html to shots/boards/bN.png
// (1920 wide) plus a contact sheet shots/boards/sheet.png.
//   node tools/figma-plugin/behance-boards-render.mjs [file.html] [out dir]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [htmlArg = "behance-boards.html", outArg = "shots/boards"] = process.argv.slice(2);
const out = path.join(here, outArg);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
await p.goto(pathToFileURL(path.join(here, htmlArg)).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);
const ids = await p.$$eval("section.b", (s) => s.map((e) => e.id));
for (const id of ids) {
  await p.locator("#" + id).screenshot({ path: path.join(out, id + ".png") });
  console.log(id, Math.round(fs.statSync(path.join(out, id + ".png")).size / 1024) + " KB");
}
await p.setViewportSize({ width: 1920, height: 1200 });
await p.screenshot({ path: path.join(out, "sheet.png"), fullPage: true, scale: "css" });
await b.close();
