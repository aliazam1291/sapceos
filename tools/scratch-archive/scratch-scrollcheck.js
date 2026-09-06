const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/galaxy", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  console.log("scrollY before:", await page.evaluate(() => window.scrollY));

  // Click the + button via a direct DOM dispatch, no Playwright auto-scroll behavior.
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const plus = btns.find((b) => b.textContent.trim() === "+");
    for (let i = 0; i < 4; i++) plus.click();
  });
  await page.waitForTimeout(600);
  console.log("scrollY after 4x +:", await page.evaluate(() => window.scrollY));
  await page.screenshot({ path: path.join(OUT, "scrollcheck-after.png") });

  await browser.close();
})();
