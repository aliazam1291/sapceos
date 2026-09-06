const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();

  // 1. Normal motion: split should happen and text must end up visible.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()}`); });

  await page.goto("http://localhost:3000/missions", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return null;
    const cs = getComputedStyle(h1);
    return {
      text: h1.textContent.trim().slice(0, 60),
      ariaLabel: h1.getAttribute("aria-label"),
      lineCount: h1.querySelectorAll("div").length,
      opacity: cs.opacity,
      visibility: cs.visibility,
      height: Math.round(h1.getBoundingClientRect().height),
    };
  });
  console.log("motion-on h1:", JSON.stringify(info));
  await page.screenshot({ path: path.join(OUT, "text-missions.png") });

  // 2. Reduced motion: SplitText must not run, text must still be there.
  const rm = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await rm.goto("http://localhost:3000/missions", { waitUntil: "networkidle" });
  await rm.waitForTimeout(1500);
  const rmInfo = await rm.evaluate(() => {
    const h1 = document.querySelector("h1");
    const cs = getComputedStyle(h1);
    return {
      text: h1.textContent.trim().slice(0, 60),
      lineCount: h1.querySelectorAll("div").length,
      opacity: cs.opacity,
      height: Math.round(h1.getBoundingClientRect().height),
    };
  });
  console.log("reduced-motion h1:", JSON.stringify(rmInfo));
  await rm.screenshot({ path: path.join(OUT, "text-missions-reduced.png") });

  console.log("--- errors ---");
  console.log([...new Set(errors)].join("\n") || "(none)");
  await browser.close();
})();
