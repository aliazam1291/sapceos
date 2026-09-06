const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack || ""}`));
  page.on("console", (m) => { if (m.type() === "error" || m.type()==="warning") errors.push(`[${m.type()}] ${m.text()}`); });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, "home-longwait.png") });

  const canvasInfo = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll("canvas")];
    return canvases.map((c) => ({
      w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight,
      cls: c.className,
    }));
  });
  console.log("canvases:", JSON.stringify(canvasInfo, null, 2));
  console.log("--- errors ---");
  console.log([...new Set(errors)].join("\n") || "(none)");

  await browser.close();
})();
