import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { siteUrl } from "@/lib/site";
import { missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { hostedWriting } from "@/content/writing";
import { legacyRedirect } from "@/lib/legacy";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists absolute https URLs on the site's own origin, once each", () => {
    for (const u of urls) expect(u.startsWith(siteUrl)).toBe(true);
    expect(siteUrl.startsWith("https://")).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("includes every mission, field note and published essay", () => {
    for (const m of missions) expect(urls).toContain(`${siteUrl}/missions/${m.slug}`);
    for (const n of fieldNotes) expect(urls).toContain(`${siteUrl}/field-notes/${n.slug}`);
    for (const p of hostedWriting.filter((p) => p.status === "published")) expect(urls).toContain(`${siteUrl}/writing/${p.slug}`);
  });

  it("advertises the pages a recruiter lands on", () => {
    for (const path of ["/hire", "/faq", "/about", "/contact"]) expect(urls).toContain(`${siteUrl}${path}`);
  });

  it("never advertises a draft or a private tool page", () => {
    for (const p of hostedWriting.filter((p) => p.status !== "published")) expect(urls).not.toContain(`${siteUrl}/writing/${p.slug}`);
    expect(urls.some((u) => /\/icon-lab|\/api\//.test(u))).toBe(false);
  });

  it("carries real lastmod dates, never the build time and never the future", () => {
    const tomorrow = Date.now() + 864e5;
    for (const e of entries) {
      const t = new Date(e.lastModified as Date).getTime();
      expect(Number.isNaN(t)).toBe(false);
      expect(t).toBeLessThanOrEqual(tomorrow);
    }
    // A build-time stamp would make every entry identical to the second.
    const distinct = new Set(entries.map((e) => new Date(e.lastModified as Date).toISOString()));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it("keeps priorities in range with home at the top", () => {
    for (const e of entries) expect(e.priority).toBeGreaterThanOrEqual(0);
    for (const e of entries) expect(e.priority).toBeLessThanOrEqual(1);
    expect(entries.find((e) => e.url === siteUrl)?.priority).toBe(1);
  });
});

describe("robots", () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];

  it("allows everything and blocks nothing", () => {
    expect(rules.find((x) => x.userAgent === "*")?.allow).toBe("/");
    for (const x of rules) expect(x.disallow ?? []).not.toContain("/");
  });

  it("names the sitemap on the same origin", () => {
    expect(r.sitemap).toBe(`${siteUrl}/sitemap.xml`);
  });

  it("lets the answer-engine crawlers in by name", () => {
    const named = rules.flatMap((x) => (Array.isArray(x.userAgent) ? x.userAgent : [x.userAgent]));
    for (const bot of ["OAI-SearchBot", "PerplexityBot", "Claude-SearchBot"]) expect(named).toContain(bot);
  });
});

describe("old URLs (pre-Space-OS) redirect in one hop", () => {
  const go = async (fallback: string, slug: string) => {
    const res = await legacyRedirect(fallback)(new Request(`${siteUrl}/case-studies/${slug}`), {
      params: Promise.resolve({ slug }),
    });
    return { status: res.status, to: new URL(res.headers.get("location") ?? "").pathname };
  };

  it("sends the case study Google still holds to its field note", async () => {
    expect(await go("/field-notes", "uber-driver-retention")).toEqual({ status: 308, to: "/field-notes/uber-driver-retention" });
  });

  it("sends a mission slug to its report", async () => {
    const slug = missions[0].slug;
    expect(await go("/missions", slug)).toEqual({ status: 308, to: `/missions/${slug}` });
  });

  it("sends an essay slug to /writing", async () => {
    const p = hostedWriting.find((p) => p.status === "published")!;
    expect(await go("/writing", p.slug!)).toEqual({ status: 308, to: `/writing/${p.slug}` });
  });

  it("sends an unknown slug to the section index, never a 404", async () => {
    expect(await go("/missions", "no-such-thing")).toEqual({ status: 308, to: "/missions" });
  });
});
