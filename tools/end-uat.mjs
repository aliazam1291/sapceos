import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(2500);
const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let y = 0; y < H; y += 160) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(40); }
await p.evaluate(() => window.scrollTo(0, 1e9));
await p.waitForTimeout(4000);
await p.screenshot({ path: "tools/shots/home-end.png" });
const op = await p.evaluate(() => document.querySelector('[data-section="Operator"]')?.getBoundingClientRect().top + scrollY);
if (op) { await p.evaluate((y) => window.scrollTo(0, y - 80), op); await p.waitForTimeout(3500); await p.screenshot({ path: "tools/shots/home-operator.png" }); }
console.log("errors", errs.length, errs.slice(0, 3));
await b.close();
