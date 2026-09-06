const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/about", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const links = [...document.querySelectorAll("header a")];
    return links.slice(0, 10).map((a) => {
      const cs = getComputedStyle(a);
      return {
        text: a.textContent.trim().slice(0, 20),
        cls: String(a.className).slice(0, 70),
        color: cs.color,
        background: cs.backgroundColor,
        padding: cs.padding,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
