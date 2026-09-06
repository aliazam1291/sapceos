const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const wrap1 = canvas.parentElement; // R3F outer div
    const wrap2 = wrap1.parentElement; // .canvas styled div
    return {
      canvasInlineStyle: canvas.getAttribute("style"),
      canvasWidthAttr: canvas.width,
      canvasHeightAttr: canvas.height,
      wrap1InlineStyle: wrap1.getAttribute("style"),
      wrap1Class: wrap1.className,
      wrap2InlineStyle: wrap2.getAttribute("style"),
      wrap2Class: wrap2.className,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
