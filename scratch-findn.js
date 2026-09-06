const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll("body *")].filter((el) => {
      const t = el.textContent?.trim();
      return t === "N" && el.children.length === 0;
    });
    return els.map((el) => {
      const anc = [];
      let cur = el;
      for (let i = 0; i < 6 && cur; i++) {
        anc.push(cur.tagName + (cur.className ? "." + String(cur.className).slice(0, 40) : ""));
        cur = cur.parentElement;
      }
      const cs = getComputedStyle(el.parentElement);
      return { chain: anc, parentPos: cs.position, parentBottom: cs.bottom, parentLeft: cs.left, outer: el.parentElement.outerHTML.slice(0, 300) };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
