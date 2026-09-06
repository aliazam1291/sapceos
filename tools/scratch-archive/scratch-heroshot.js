const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  desktop.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") errors.push(`[desktop ${m.type()}] ${m.text()}`); });
  desktop.on("pageerror", (e) => errors.push(`[desktop pageerror] ${e.message}`));
  await desktop.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(2200);
  await desktop.screenshot({ path: path.join(OUT, "hero-v2-desktop.png") });

  const galaxyPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await galaxyPage.goto("http://localhost:3000/galaxy", { waitUntil: "networkidle" });
  await galaxyPage.waitForTimeout(1500);
  await galaxyPage.screenshot({ path: path.join(OUT, "galaxy-v2-desktop.png") });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(2200);
  await mobile.screenshot({ path: path.join(OUT, "hero-v2-mobile.png") });

  console.log("--- console/page errors ---");
  console.log([...new Set(errors)].join("\n") || "(none)");

  await browser.close();
})();
