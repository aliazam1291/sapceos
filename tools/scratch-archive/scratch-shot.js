const { chromium } = require("playwright");
const path = require("path");

const OUT = process.argv[2] || ".";
const BASE = process.argv[3] || "http://localhost:3000";

const pages = [
  { path: "/", name: "home" },
  { path: "/galaxy", name: "galaxy" },
  { path: "/missions", name: "missions" },
  { path: "/missions/vahan-shakti", name: "mission-report" },
  { path: "/orbit", name: "orbit" },
  { path: "/lab", name: "lab" },
  { path: "/mission-history", name: "mission-history" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
];

(async () => {
  const browser = await chromium.launch();

  for (const viewport of [
    { w: 1440, h: 900, tag: "desktop" },
    { w: 390, h: 844, tag: "mobile" },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.w, height: viewport.h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`[console] ${m.text()}`);
    });

    for (const p of pages) {
      try {
        await page.goto(BASE + p.path, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1200); // let canvases/reveals settle
        await page.screenshot({
          path: path.join(OUT, `${p.name}-${viewport.tag}.png`),
          fullPage: viewport.tag === "desktop" ? false : true,
        });
        console.log(`OK ${viewport.tag} ${p.path}`);
      } catch (e) {
        console.log(`FAIL ${viewport.tag} ${p.path}: ${e.message}`);
      }
    }

    if (errors.length) {
      console.log(`--- console/page errors (${viewport.tag}) ---`);
      console.log([...new Set(errors)].slice(0, 20).join("\n"));
    }
    await page.close();
  }

  await browser.close();
})();
