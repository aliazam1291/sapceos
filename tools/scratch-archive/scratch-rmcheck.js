const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/missions", { waitUntil: "networkidle" });
  const rm = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  console.log("prefers-reduced-motion: reduce ->", rm);
  await browser.close();
})();
