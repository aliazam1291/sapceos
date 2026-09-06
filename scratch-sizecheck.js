const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return { error: "no canvas" };
    const chain = [];
    let cur = canvas;
    for (let i = 0; i < 8 && cur; i++) {
      const r = cur.getBoundingClientRect();
      const cs = getComputedStyle(cur);
      chain.push({
        tag: cur.tagName,
        cls: String(cur.className).slice(0, 70),
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
        display: cs.display,
        position: cs.position,
        height: cs.height,
        minHeight: cs.minHeight,
        gridTemplateColumns: cs.gridTemplateColumns,
        alignItems: cs.alignItems,
      });
      cur = cur.parentElement;
    }
    return { chain };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
