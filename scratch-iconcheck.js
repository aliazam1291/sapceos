const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()}`); });

  await page.goto("http://localhost:3000/galaxy", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Click the Vahan Shakti node: hover reveals labels, so find it by hovering
  // around, or just click all nodes until the drawer names it.
  // Simpler: use the filter to show telematics, then click near a known star.
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll("div")].filter(d => d.textContent === "Missions Hub").length
  );
  console.log("hub labels present:", labels);

  // Click centre-ish stars until we get a drawer with an icon.
  const spots = [[720, 470], [640, 520], [820, 500], [560, 470], [900, 540], [700, 590]];
  for (const [x, y] of spots) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(2200);
    const info = await page.evaluate(() => {
      const d = document.querySelector('[class*="__drawer"]');
      if (!d) return null;
      const img = d.querySelector("img");
      const title = d.querySelector('[class*="drawerTitle"]')?.textContent;
      return { title, hasIcon: !!img, iconSrc: img?.getAttribute("src") || null, natural: img ? img.naturalWidth : 0 };
    });
    if (info) console.log(`click ${x},${y} ->`, JSON.stringify(info));
    if (info?.hasIcon) {
      await page.screenshot({ path: path.join(OUT, "drawer-icon.png") });
      break;
    }
  }

  console.log("--- errors ---");
  console.log([...new Set(errors)].join("\n") || "(none)");
  await browser.close();
})();
