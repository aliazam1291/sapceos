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
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "int-0-initial.png") });

  // Click zoom-in 4 times, screenshot after.
  for (let i = 0; i < 4; i++) {
    await page.click("button:has-text('+')");
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "int-1-after-zoomin.png") });

  // Read the zoom readout text.
  const zoomText = await page.textContent("text=/\\d+%/");
  console.log("zoom readout after 4x +:", zoomText);

  // Click Reset.
  await page.click("button:has-text('Reset')");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "int-2-after-reset.png") });

  // Click a star node (canvas click at a position where a planet sphere is).
  // Use the "Missions Hub" label's position as a proxy anchor, click slightly below it.
  const label = await page.locator("text=Missions Hub").first();
  const box = await label.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height + 25);
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, "int-3-after-star-click.png") });

  console.log("--- errors ---");
  console.log([...new Set(errors)].join("\n") || "(none)");

  await browser.close();
})();
