// Render thumbnail.html to shots/community-thumbnail.png (1920×1080) and a
// 300px preview (how the Community grid shows it).
//   node tools/figma-plugin/thumbnail-render.mjs
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(pathToFileURL(path.join(here, "thumbnail.html")).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
await p.screenshot({ path: path.join(here, "shots", "community-thumbnail.png") });
const s = await b.newPage({ viewport: { width: 320, height: 180 }, deviceScaleFactor: 1 });
await s.setContent(`<body style="margin:0;background:#1e1e1e"><img src="${pathToFileURL(path.join(here, "shots", "community-thumbnail.png")).href}" style="width:320px;height:180px;display:block"></body>`);
await s.waitForTimeout(300);
await s.screenshot({ path: path.join(here, "shots", "community-thumbnail-320.png") });
await b.close();
console.log("rendered");
