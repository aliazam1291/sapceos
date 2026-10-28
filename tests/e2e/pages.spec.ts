import { expect, test, type Page } from "@playwright/test";

/*
 * The reader's side: key pages load without errors, the structure a screen
 * reader and a keyboard rely on is there, nothing scrolls sideways on a
 * phone, and the front door's launch sequence only plays for the visitor it
 * is meant for.
 */

// Vercel serves its analytics scripts under /_vercel on a deployment only;
// a local production server 404s them as text/plain.
test.beforeEach(async ({ page }) => {
  await page.route("**/_vercel/**", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
});

const skipBoot = (page: Page) => page.addInitScript(() => sessionStorage.setItem("space-os:booted", "1"));

// One of each kind of page: the indexes plus the first report, note and essay.
const ROUTES = ["/", "/missions", "/missions/vahan-shakti", "/field-notes/uber-driver-retention", "/writing/ai-agent-frameworks", "/about", "/contact", "/faq"];

// Three's deprecation notice and a Next preload hint for the deferred ship
// are known noise (CLAUDE.md, "The audit sweep"); SwiftShader adds its own.
const NOISE = /THREE\.Clock|GPU stall|SwiftShader|software WebGL|was preloaded using link preload/i;

for (const route of ROUTES) {
  test(`${route} loads cleanly and is navigable`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !NOISE.test(m.text())) errors.push(m.text());
    });
    await skipBoot(page);
    const res = await page.goto(route, { waitUntil: "load" });
    expect(res?.status()).toBe(200);

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();

    // No sideways scroll, on any viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
}

test("the first Tab lands on the skip link, and it goes to the content", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard path");
  await skipBoot(page);
  await page.goto("/about", { waitUntil: "load" });
  await page.keyboard.press("Tab");
  const skip = page.locator("a.skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("every image has alt text and every link has a name", async ({ page }) => {
  await skipBoot(page);
  for (const route of ["/", "/missions", "/about"]) {
    await page.goto(route, { waitUntil: "load" });
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll("img:not([alt])").forEach((i) => out.push(`img ${(i as HTMLImageElement).src.slice(-40)}`));
      document.querySelectorAll("a[href]").forEach((a) => {
        const name = (a.getAttribute("aria-label") ?? a.textContent ?? "").trim() || a.querySelector("img[alt]")?.getAttribute("alt") || a.getAttribute("title");
        if (!name) out.push(`link ${a.getAttribute("href")}`);
      });
      return out;
    });
    expect(bad, route).toEqual([]);
  }
});

test.describe("the launch sequence", () => {
  test("plays on a first visit to the front door, and Skip cuts through", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const boot = page.getByRole("dialog", { name: "Space OS launch sequence" });
    await expect(boot).toBeVisible();
    await page.getByRole("button", { name: /skip/i }).click();
    await expect(boot).toBeHidden({ timeout: 20_000 });
  });

  test("never plays for a reader sent by a search engine", async ({ page }) => {
    await page.goto("/", { waitUntil: "load", referer: "https://www.google.com/" });
    expect(await page.evaluate(() => document.referrer)).toMatch(/google/);
    await page.waitForTimeout(1500);
    await expect(page.getByRole("dialog", { name: "Space OS launch sequence" })).toHaveCount(0);
  });

  test("never plays on a deep link", async ({ page }) => {
    await page.goto("/about", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await expect(page.getByRole("dialog", { name: "Space OS launch sequence" })).toHaveCount(0);
  });
});

test("the command palette opens from the keyboard and finds a mission", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard path");
  await skipBoot(page);
  await page.goto("/missions", { waitUntil: "load" });
  await page.keyboard.press("Control+K");
  const palette = page.getByRole("dialog", { name: "Mission control" });
  await expect(palette).toBeVisible();
  await page.getByRole("combobox", { name: "Go to" }).fill("vahan");
  await expect(page.getByRole("option").first()).toContainText(/Vahan/i);
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
});
