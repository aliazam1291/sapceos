const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()}`); });

  // A page with no galaxy on it — proves the sitewide field, not the panel.
  await page.goto("http://localhost:3000/about", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const layers = document.querySelectorAll('[class*="__layer"]');
    const circles = document.querySelectorAll('[class*="deepSpace"] circle');
    const root = document.querySelector('[class*="deepSpace"]');
    return {
      layerCount: layers.length,
      starCount: circles.length,
      scrollVar: root ? getComputedStyle(root).getPropertyValue("--scroll") : null,
      firstLayerTransform: layers[0] ? getComputedStyle(layers[0]).transform : null,
    };
  });
  console.log("at top:", JSON.stringify(info));
  await page.screenshot({ path: path.join(OUT, "stars-about-top.png") });

  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);

  const after = await page.evaluate(() => {
    const layers = document.querySelectorAll('[class*="__layer"]');
    const root = document.querySelector('[class*="deepSpace"]');
    return {
      scrollVar: root ? getComputedStyle(root).getPropertyValue("--scroll") : null,
      near: layers[2] ? getComputedStyle(layers[2]).transform : null,
      far: layers[0] ? getComputedStyle(layers[0]).transform : null,
    };
  });
  console.log("after scroll:", JSON.stringify(after));
  await page.screenshot({ path: path.join(OUT, "stars-about-scrolled.png") });

  console.log("--- errors ---");
  console.log([...new Set(errors)].join("\n") || "(none)");
  await browser.close();
})();
