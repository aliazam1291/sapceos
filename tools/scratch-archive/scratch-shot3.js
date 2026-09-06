const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log("scrollHeight:", height);

  await page.evaluate(() => window.scrollTo(0, 1560));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "seq-fix-1.png") });

  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "seq-fix-2.png") });

  await browser.close();
})();
