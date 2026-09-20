// Render the one-page résumé (tools/resume/resume.html) to PDF and a PNG
// proof. Preview by default; PUBLISH=1 writes public/Ali_Azam_Kazmi_.pdf,
// the file every "Résumé (PDF)" link on the site points at.
//
//   node tools/resume-build.mjs            → tools/shots/resume.pdf + resume.png
//   PUBLISH=1 node tools/resume-build.mjs  → public/Ali_Azam_Kazmi_.pdf as well
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('tools/resume/resume.html');
fs.mkdirSync('tools/shots', { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
await p.goto('file:///' + src.replace(/\\/g, '/'), { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
// Overflow check: the body is exactly one A4 page; anything below 297mm is lost.
const over = await p.evaluate(() => Math.max(0, document.body.scrollHeight - document.body.clientHeight));
await p.pdf({ path: 'tools/shots/resume.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
await p.screenshot({ path: 'tools/shots/resume.png', fullPage: false });
if (process.env.PUBLISH) fs.copyFileSync('tools/shots/resume.pdf', 'public/Ali_Azam_Kazmi_.pdf');
console.log(over ? `OVERFLOW by ${over}px — trim before publishing` : 'fits one page', process.env.PUBLISH ? '· published to public/Ali_Azam_Kazmi_.pdf' : '· preview only');
await b.close();
