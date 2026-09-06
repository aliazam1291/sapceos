const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://localhost:3000/missions", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const rows = document.querySelectorAll("[class*='MissionRow'], article");
    const list = document.querySelector("[class*='MissionFilter_result'], [class*='result']");
    return {
      rowCount: rows.length,
      resultText: list?.textContent,
      rowsHTML: [...rows].slice(0, 2).map(r => ({
        cls: r.className,
        visible: r.getBoundingClientRect(),
        opacity: getComputedStyle(r).opacity,
        hasReveal: r.hasAttribute("data-reveal"),
        isVisibleClass: r.classList.contains("is-visible"),
      })),
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Scroll down slowly to trigger intersection observers naturally, then screenshot.
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y < total; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "missions-mobile-scrolled.png"), fullPage: true });

  await browser.close();
})();
