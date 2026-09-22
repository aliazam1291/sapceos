/*
 * Is every fact in PROFILE.md actually on the site? (2026-09-22)
 *
 * Crude but honest: it pulls the named entities out of PROFILE.md — every
 * project in the shipped table, every client, employer, certification,
 * skill and link — and greps the built content for each. It cannot check
 * wording; it catches the thing that actually goes wrong, which is a fact
 * Ali gave us that nobody ever put on a page.
 *
 *   node tools/profile-coverage.mjs
 */
import fs from "node:fs";

const profile = fs.readFileSync("PROFILE.md", "utf8");
const content = fs
  .readdirSync("src/content")
  .filter((f) => f.endsWith(".ts"))
  .map((f) => fs.readFileSync(`src/content/${f}`, "utf8"))
  .join("\n");

// A trailing parenthetical in PROFILE.md ("Indane Yatra Mitra (IOCL)") is
// context for the reader of that file, not part of the product's name.
const norm = (s) => s.toLowerCase().replace(/\s*\([^)]*\)\s*$/, "").replace(/[^a-z0-9]+/g, " ").trim();
const haystack = norm(content);
const has = (s) => haystack.includes(norm(s));

const groups = {
  "Shipped projects": [...profile.matchAll(/^\| \*\*(.+?)\*\*/gm)].map((m) => m[1]),
  Employers: ["MapMyIndia", "Smaak.ux", "Wise Work", "Datamatics", "Green Monk Energy", "Tech Analogy", "DumbMoney"],
  "Studio clients": ["Atmos", "Mintair", "Ravenouxs", "Lean Multiverse", "Ekal", "Urban Livin", "Sorted Blinds", "Posh Dikur"],
  "Case studies": ["Linear vs Jira", "AI Code Assistant", "Apple Ecosystem", "Flipkart", "Uber Driver Retention", "Logistics Visibility"],
  Certifications: [...profile.matchAll(/^- (.+?) — (?:AWS|Google|University at Buffalo|Aha!)/gm)].map((m) => m[1]),
  Leadership: ["Technical Convener", "Alexa Developers", "Milan", "GitHub SRM Ideathon"],
  Education: ["SRM Institute", "8.76"],
  Links: [...profile.matchAll(/^- (?:GitHub|LinkedIn|Behance|Figma|Medium|HackerRank|Coursera|Credly|Holopin): (\S+)/gm)].map((m) => m[1]),
  Skills: [...profile.matchAll(/\*\*(?:Technical|Design|Product):\*\* (.+)/g)].flatMap((m) => m[1].split(/,\s*/)).map((s) => s.replace(/ —.*/, "").trim()),
};

let missing = 0;
for (const [group, items] of Object.entries(groups)) {
  const gaps = [...new Set(items)].filter((i) => i && !has(i));
  missing += gaps.length;
  console.log(`${gaps.length ? "MISSING" : "ok     "}  ${group.padEnd(18)} ${items.length - gaps.length}/${[...new Set(items)].length}${gaps.length ? `  — ${gaps.join(", ")}` : ""}`);
}
console.log(missing ? `\n${missing} fact(s) in PROFILE.md are not in src/content.` : "\nEvery named fact in PROFILE.md appears in src/content.");
