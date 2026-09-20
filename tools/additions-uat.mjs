/*
 * The 2026-09-17 additions, in one pass: the hero opener + skip, the slim
 * HUD, the ownership strip on a report, /decisions beacons, the contact
 * "looking for" line, the résumé on the pad. Shoots each for eyeballing and
 * checks the text is actually there.
 *
 *   node tools/additions-uat.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const issues = [];
const has = async (sel, what) => { if (!(await p.locator(sel).count())) issues.push("missing: " + what); };

await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(4500);
await p.screenshot({ path: "tools/shots/add-home.png" });
await has("text=Give me a problem", "hero opener pitch");
await has("text=Skip the flight", "skip the flight");
await has("text=200,000+", "hero proof number");
// Scroll to the pad; the résumé should be there.
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await p.waitForTimeout(2500);
await has("a[href='/Ali_Azam_Kazmi_.pdf']", "résumé on the pad");

await p.goto(BASE + "/decisions", { waitUntil: "load" });
await p.waitForTimeout(2500);
await p.screenshot({ path: "tools/shots/add-decisions.png", fullPage: true });
await has("text=Define the states before the screens", "first flight rule");
if ((await p.locator("ol[aria-label='Flight rules'] li").count()) !== 7) issues.push("expected 7 beacons");

await p.goto(BASE + "/missions/technician-app", { waitUntil: "load" });
await p.waitForTimeout(2500);
const own = p.locator("section[aria-label='Ownership']");
if (!(await own.count())) issues.push("missing: ownership strip");
else { await own.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await own.screenshot({ path: "tools/shots/add-ownership.png" }); }
await has("a[href='/Ali_Azam_Kazmi_.pdf']", "résumé in report footer");

await p.goto(BASE + "/contact", { waitUntil: "load" });
await p.waitForTimeout(2000);
await has("text=Looking for", "looking-for line");
await p.screenshot({ path: "tools/shots/add-contact.png" });

if (errors.length) issues.push("page errors: " + errors.join(" | "));
console.log(issues.length ? "ISSUES:\n - " + issues.join("\n - ") : "OK: all additions present, no page errors");
await b.close();
