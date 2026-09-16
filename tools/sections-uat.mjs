import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const H = document.documentElement.scrollHeight - innerHeight;
  return [...document.querySelectorAll("[data-section], footer")].map((el) => {
    const b = el.getBoundingClientRect();
    return { s: el.getAttribute("data-section") || "footer", top: +((b.top + scrollY) / H).toFixed(3), bottom: +((b.bottom + scrollY - innerHeight) / H).toFixed(3) };
  }).concat([{ s: "H", top: H }]);
});
console.log(JSON.stringify(r));
await b.close();
