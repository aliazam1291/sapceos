const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1200);

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log("scrollHeight:", height);

  // Walk down in viewport-height chunks and screenshot each.
  const chunk = 844;
  let i = 0;
  for (let y = 0; y < height; y += chunk) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, `home-mobile-strip-${i}.png`) });
    i++;
  }

  // Dump bounding boxes of top-level sections for diagnosis.
  const boxes = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("body > * , main > *").forEach((el) => {
      const r = el.getBoundingClientRect();
      out.push({
        tag: el.tagName,
        cls: (el.className || "").toString().slice(0, 60),
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
      });
    });
    return out;
  });
  console.log(JSON.stringify(boxes, null, 2));

  await browser.close();
})();
