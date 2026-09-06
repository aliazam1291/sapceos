const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const body = document.body;
    const csH1 = h1 ? getComputedStyle(h1) : null;
    const csBody = getComputedStyle(body);
    return {
      h1Font: csH1?.fontFamily,
      h1Weight: csH1?.fontWeight,
      bodyFont: csBody.fontFamily,
      rootVars: getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans"),
      fontsLoaded: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
