const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/galaxy", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Find a hub label, then click just below it — that's where its star sits.
  const label = page.locator("text=Missions Hub").first();
  const box = await label.boundingBox();
  if (!box) { console.log("label not found"); await browser.close(); return; }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height + 30);
  await page.waitForTimeout(1400);

  const opened = await page.evaluate(() => !!document.querySelector('[class*="__drawer"]'));
  console.log("drawer opened:", opened);
  await page.screenshot({ path: path.join(OUT, "drawer.png") });

  await browser.close();
})();
