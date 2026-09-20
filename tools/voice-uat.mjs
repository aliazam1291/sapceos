/*
 * The voice pass (2026-09-18): the comms transcript on beat 0, the
 * debrief, the rules and notes legs, touchdown, every secondary page's
 * header, the footer line and the boot line. Checks each transcript
 * actually types out (Comms arms on arrival) and shoots the ones that
 * changed the layout.
 *
 *   node tools/voice-uat.mjs   (BASE=http://localhost:3000)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const issues = [];
const has = async (needle, label) => {
  try { await p.locator(`text=${needle}`).first().waitFor({ timeout: 8000 }); }
  catch { issues.push(`${label}: not found: ${needle}`); }
};
const logsOn = async (route, label, wait = 4500) => {
  await p.goto(BASE + route, { waitUntil: "load" });
  await p.waitForTimeout(wait);
  const n = await p.locator("ol[aria-label='Comms'] li").count();
  if (!n) issues.push(`${label}: no comms line typed on ${route}`);
  return n;
};

// Home, beat 0: the transcript top-right.
const home = await logsOn("/", "boarding", 5000);
await p.screenshot({ path: "tools/shots/voice-home.png" });
console.log("home beat 0 comms lines:", home);
await has("No cookies on board", "footer");

// Debrief.
await p.evaluate(() => document.getElementById("debrief")?.scrollIntoView({ block: "center" }));
await p.waitForTimeout(4500);
await p.screenshot({ path: "tools/shots/voice-debrief.png" });
await has("Roadmaps, notably, do not", "debrief");

// Touchdown, once landed.
await p.evaluate(() => document.getElementById("landing")?.scrollIntoView({ block: "start" }));
await p.waitForTimeout(10000);
await p.screenshot({ path: "tools/shots/voice-landed.png" });
await has("remain seated", "touchdown");

// Secondary pages.
for (const [route, needle] of [
  ["/missions", "he has been waiting"],
  ["/lab", "surprised everyone"],
  ["/field-notes", "disagree with"],
  ["/decisions", "Rule seven is about this file"],
  ["/about", "says the same thing louder"],
  ["/mission-history", "worse typography"],
  ["/contact", "Earth time"],
]) {
  await logsOn(route, route, 4000);
  await has(needle, route);
}
await p.screenshot({ path: "tools/shots/voice-contact.png" });

if (errors.length) issues.push("page errors: " + errors.join(" | "));
console.log(issues.length ? "ISSUES:\n - " + issues.join("\n - ") : "OK: every transcript types, footer line present, no page errors");
await b.close();
