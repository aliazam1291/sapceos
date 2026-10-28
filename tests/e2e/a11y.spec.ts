import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Accessibility, by axe-core against WCAG 2.1 A and AA. Serious and critical
 * violations fail; moderate and minor are printed so they are seen.
 *
 * Reduced motion is emulated so scroll-driven fades and typed transcripts
 * are settled when axe measures contrast — a line caught at 40% opacity
 * mid-animation is not a contrast failure a reader ever sees.
 */
test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  await page.route("**/_vercel/**", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
});

const ROUTES = ["/", "/missions", "/missions/vahan-shakti", "/field-notes", "/field-notes/uber-driver-retention", "/writing", "/writing/ai-agent-frameworks", "/about", "/decisions", "/contact", "/faq", "/studio", "/smaak", "/dumbmoney"];

for (const route of ROUTES) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("space-os:booted", "1"));
    await page.goto(route, { waitUntil: "load" });
    // Hydration and the first scene frames land in this window under
    // SwiftShader; measuring sooner caught text mid-fade.
    await page.waitForTimeout(2500);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const fmt = (v: (typeof violations)[number]) =>
      `${v.impact} ${v.id}: ${v.help} — ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join(" | ")}${v.nodes.length > 3 ? ` (+${v.nodes.length - 3})` : ""}`;
    const blocking = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    const advisory = violations.filter((v) => !blocking.includes(v));
    if (advisory.length) console.log(`${route} advisory:\n  ${advisory.map(fmt).join("\n  ")}`);
    expect(blocking.map(fmt)).toEqual([]);
  });
}
