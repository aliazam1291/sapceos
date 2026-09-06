const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  await page.goto("http://localhost:3000/about", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const all = [...document.querySelectorAll("[data-reveal]")];
    return {
      total: all.length,
      visibleCount: all.filter((e) => e.classList.contains("is-visible")).length,
      sample: all.slice(0, 3).map((e) => ({
        cls: e.className,
        top: e.getBoundingClientRect().top,
        isVisible: e.classList.contains("is-visible"),
      })),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  console.log("--- console ---");
  console.log(logs.join("\n") || "(none)");

  await browser.close();
})();
