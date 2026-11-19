// Render behance-cover.html to shots/behance-cover.png (1616×1264).
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1616, height: 1264 } });
await p.goto(pathToFileURL(path.join(here, "behance-cover.html")).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.screenshot({ path: path.join(here, "shots", "behance-cover.png") });
await b.close();
console.log("rendered");
