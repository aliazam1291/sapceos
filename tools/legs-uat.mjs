/*
 * The home legs (2026-09-18 flow), one shot each after arrival: debrief
 * (numbers in orbit), flight rules (beacons + ship), drone bay (drones
 * pre-lit, then landed), touchdown (the statement). Also checks the route
 * rail reads "Leg N / 06".
 *
 *   node tools/legs-uat.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(4000);
const issues = [];

const go = async (id, offset = 0) => {
  await p.evaluate(({ id, offset }) => {
    const el = document.getElementById(id);
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + offset);
  }, { id, offset });
};

const sections = await p.evaluate(() => [...document.querySelectorAll("[data-section]")].map((e) => e.getAttribute("data-section")));
console.log("sections:", sections.join(" → "));
if (sections.length !== 6) issues.push(`expected 6 legs, got ${sections.length}`);

// Debrief: wait for the scene's canvas, hold, shoot.
const hole = await p.evaluate(() => document.querySelector("[data-section='Debrief']")?.id ?? null);
await p.evaluate(() => document.querySelector("[data-section='Debrief']")?.scrollIntoView({ block: "center" }));
await p.waitForTimeout(3500);
await p.screenshot({ path: "tools/shots/leg-debrief.png" });
const masses = await p.locator("[data-section='Debrief'] ol li").count();
if (masses < 3) issues.push("debrief: fewer than 3 masses");
const rail = await p.locator("nav[aria-label='Page sections'] p").nth(1).textContent();
console.log("rail:", rail?.trim());
if (!/Leg 03 \/ 06/.test(rail ?? "")) issues.push("rail did not read Leg 03 / 06 on the debrief");

// Flight rules.
await go("rules", -120);
await p.waitForTimeout(2500);
await p.screenshot({ path: "tools/shots/leg-rules.png" });
if ((await p.locator("#rules ol[aria-label='Flight rules'] li").count()) !== 3) issues.push("rules: expected 3 beacons");

// Drone bay: shoot on the frame of arrival (drones pre-lit), then landed.
await go("notes", -80);
await p.waitForTimeout(250);
await p.screenshot({ path: "tools/shots/leg-notes-arrive.png" });
await p.waitForTimeout(4500);
await p.screenshot({ path: "tools/shots/leg-notes-landed.png" });

// Touchdown: the statement once landed.
await go("landing", 0);
await p.waitForTimeout(9000);
await p.screenshot({ path: "tools/shots/leg-touchdown.png" });
const title = await p.locator("#landing h2").first().textContent();
console.log("touchdown title:", title?.trim());
if (!/I learn whatever I need/.test(title ?? "")) issues.push("touchdown did not say the statement");

if (errors.length) issues.push("page errors: " + errors.join(" | "));
console.log(issues.length ? "ISSUES:\n - " + issues.join("\n - ") : "OK: six legs, rail counts, statement on the pad");
await b.close();
