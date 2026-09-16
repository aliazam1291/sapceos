// Prints console errors/warnings from the home page (shader compile logs land here).
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// The launch sequence shows once per session; harnesses skip it.
await p.addInitScript(() => { try { sessionStorage.setItem("space-os:booted", "1"); } catch {} });
p.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console.log(`[${m.type()}] ${m.text().slice(0, 1200)}`);
});
p.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 600)));
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(6000);
await b.close();
