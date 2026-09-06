const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const [route, name, y] of [
    ["/lab", "cards-lab", 700],
    ["/field-notes", "cards-notes", 700],
    ["/about", "cards-about", 500],
  ]) {
    await page.goto("http://localhost:3000" + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1600);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log("shot", route);
  }

  // Measure card heights to check for ragged/unequal cards.
  await page.goto("http://localhost:3000/lab", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const cards = await page.evaluate(() => {
    const grid = document.querySelector('[class*="__grid"]');
    if (!grid) return null;
    const cs = getComputedStyle(grid);
    return {
      cols: cs.gridTemplateColumns,
      gap: cs.gap,
      children: [...grid.children].map((c) => Math.round(c.getBoundingClientRect().height)),
    };
  });
  console.log("lab grid:", JSON.stringify(cards));

  await browser.close();
})();
