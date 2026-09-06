const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const el = document.elementFromPoint(38, 862);
    if (!el) return null;
    const chain = [];
    let cur = el;
    for (let i = 0; i < 6 && cur; i++) {
      chain.push({
        tag: cur.tagName,
        cls: String(cur.className).slice(0, 60),
        text: cur.textContent?.trim().slice(0, 30),
      });
      cur = cur.parentElement;
    }
    return { chain, html: el.outerHTML.slice(0, 400) };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
