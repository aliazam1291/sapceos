import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as missionsMod from "@/content/missions";
import * as notesMod from "@/content/field-notes";
import * as writingMod from "@/content/writing";
import * as faqMod from "@/content/faq";
import * as profileMod from "@/content/profile";
import * as studioMod from "@/content/studio";
import * as galleryMod from "@/content/gallery";
import * as ventureMod from "@/content/venture";
import * as decisionsMod from "@/content/decisions";
import * as labMod from "@/content/lab";
import { DRAFT } from "@/content/types";
import { BODY_LINK } from "@/lib/bodyText";
import sitemap from "@/app/sitemap";

/*
 * Content integrity. The site is built from these objects and nothing else,
 * so a broken cover path, a link to a page that does not exist or a slug
 * used twice is a broken page in production. These run in milliseconds and
 * catch what the browser harnesses only catch after a build.
 */

const { missions } = missionsMod;
const { fieldNotes } = notesMod;
const { writing, hostedWriting } = writingMod;
const { faqs } = faqMod;
const publicDir = path.resolve(__dirname, "../../public");
const appDir = path.resolve(__dirname, "../../src/app");

// A draft essay links to its own route, which only exists in development.
const shippedWriting = writing.filter((p) => p.status !== "draft");
const allContent = { missionsMod, notesMod, shippedWriting, faqMod, profileMod, studioMod, galleryMod, ventureMod, decisionsMod, labMod };

/** Every (key, string) pair reachable from the content modules. */
function walk(value: unknown, key = "", out: { key: string; value: string }[] = [], seen = new Set<unknown>()) {
  if (typeof value === "string") out.push({ key, value });
  else if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const [k, v] of Object.entries(value)) walk(v, Array.isArray(value) ? key : k, out, seen);
  }
  return out;
}
const strings = walk(allContent);

const ASSET_KEYS = new Set(["cover", "coverPhone", "logo", "texture", "image", "src"]);
const assetPaths = [...new Set(strings.filter((s) => ASSET_KEYS.has(s.key) && s.value.startsWith("/")).map((s) => s.value))];

const internalLinks = new Set<string>();
for (const s of strings) {
  if (s.key === "href" && s.value.startsWith("/")) internalLinks.add(s.value);
  for (const m of s.value.matchAll(BODY_LINK)) if (m[2].startsWith("/")) internalLinks.add(m[2]);
}

/** What a path can resolve to: a sitemap route, a page or route handler under src/app, a public file, or a redirect. */
const sitemapPaths = new Set(sitemap().map((e) => new URL(e.url).pathname.replace(/\/$/, "") || "/"));
const redirectSources = new Set(["/work", "/case-studies", "/blog", "/projects", "/experience", "/resume", "/cv", "/smaak-ux"]);
function resolves(href: string) {
  const p = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (sitemapPaths.has(p) || redirectSources.has(p)) return true;
  if (fs.existsSync(path.join(publicDir, p))) return true;
  const dir = path.join(appDir, p);
  return ["page.tsx", "route.ts"].some((f) => fs.existsSync(path.join(dir, f)));
}

describe("slugs", () => {
  const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const groups = {
    missions: missions.map((m) => m.slug),
    fieldNotes: fieldNotes.map((n) => n.slug),
    writing: hostedWriting.map((p) => p.slug as string),
  };

  for (const [name, slugs] of Object.entries(groups)) {
    it(`${name}: unique and kebab-case`, () => {
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of slugs) expect(s).toMatch(kebab);
    });
  }

  it("never collide across sections (the old-URL redirect looks a slug up in all three)", () => {
    const all = Object.values(groups).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it("hosted writing hrefs match their slugs", () => {
    for (const p of hostedWriting) expect(p.href).toBe(`/writing/${p.slug}`);
  });
});

describe("assets", () => {
  it("every cover, logo and texture exists under public/", () => {
    const missing = assetPaths.filter((p) => !fs.existsSync(path.join(publicDir, decodeURIComponent(p))));
    expect(missing).toEqual([]);
  });

  it("found the assets it is meant to check", () => {
    expect(assetPaths.length).toBeGreaterThan(20);
  });
});

describe("internal links", () => {
  it("every internal href in the content resolves to a page, a file or a redirect", () => {
    const broken = [...internalLinks].filter((h) => !resolves(h));
    expect(broken).toEqual([]);
  });

  it("found the links it is meant to check", () => {
    expect(internalLinks.size).toBeGreaterThan(10);
  });
});

describe("external links", () => {
  it("are https and well formed", () => {
    const external = strings.filter((s) => s.key === "href" && /^https?:/.test(s.value)).map((s) => s.value);
    expect(external.length).toBeGreaterThan(10);
    for (const h of external) {
      expect(h.startsWith("https://"), h).toBe(true);
      expect(() => new URL(h)).not.toThrow();
    }
  });
});

describe("what a reader sees", () => {
  it("no DRAFT marker in published writing, field notes or FAQ answers", () => {
    const visible = [
      ...hostedWriting.filter((p) => p.status === "published").flatMap((p) => [p.title, p.line, ...(p.body ?? [])]),
      ...fieldNotes.flatMap((n) => [n.title, n.premise, ...n.body]),
      ...faqs.flatMap((f) => [f.q, ...f.a]),
    ];
    for (const s of visible) {
      expect(s).not.toContain(DRAFT);
      expect(s).not.toMatch(/\bundefined\b|\bTODO\b|\bTBD\b|lorem ipsum/i);
    }
  });

  it("writing dates are real ISO dates and none is in the future", () => {
    const now = Date.now() + 864e5;
    for (const p of writing) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(p.date)).toBeLessThanOrEqual(now);
    }
  });

  it("every mission has a premise, a role, a stack and a report", () => {
    for (const m of missions) {
      expect(m.premise.length, m.slug).toBeGreaterThan(30);
      expect(m.role.length, m.slug).toBeGreaterThan(2);
      expect(m.stack.length, m.slug).toBeGreaterThan(0);
      expect(m.report.length, m.slug).toBeGreaterThan(0);
    }
  });

  it("FAQ questions are unique", () => {
    const qs = faqs.map((f) => f.q.toLowerCase());
    expect(new Set(qs).size).toBe(qs.length);
  });
});
