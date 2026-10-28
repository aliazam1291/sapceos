import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  clipDescription,
  faqJsonLd,
  jsonLd,
  namedTitle,
  noteJsonLd,
  personJsonLd,
  pieceJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { plainBody } from "@/lib/bodyText";
import { siteUrl } from "@/lib/site";
import { fieldNotes } from "@/content/field-notes";
import { hostedWriting } from "@/content/writing";
import { faqs } from "@/content/faq";

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe("clipDescription", () => {
  it("leaves a short description alone, whitespace collapsed", () => {
    expect(clipDescription("  Ships   fleet\nsoftware.  ")).toBe("Ships fleet software.");
  });

  it("never exceeds the limit", () => {
    const long = "Product engineer building fleet platforms for enterprise customers ".repeat(6);
    for (const max of [62, 120, 155]) expect(clipDescription(long, max).length).toBeLessThanOrEqual(max);
  });

  it("cuts on a word boundary and closes the sentence", () => {
    const long = "Telematics dashboards for fleet operators, with alarms that route to the right desk and tickets that close themselves when the vehicle recovers on its own overnight";
    const out = clipDescription(long, 80);
    expect(out.endsWith("…") || /[.!?]$/.test(out)).toBe(true);
    // Every word that survives is a whole word from the source.
    const kept = out.replace(/…$/, "").split(" ");
    const source = long.split(" ");
    kept.forEach((w, i) => expect(source[i].startsWith(w.replace(/[,;:]$/, ""))).toBe(true));
    expect(source.slice(0, kept.length).join(" ").startsWith(out.replace(/…$/, ""))).toBe(true);
  });

  it("does not leave a dangling comma before the ellipsis", () => {
    const out = clipDescription("Roadmaps, PRDs, discovery, research, analytics, experiments, launches, retention, pricing", 40);
    expect(out).not.toMatch(/[,;:]…$/);
  });
});

describe("namedTitle", () => {
  it("adds the name when it fits", () => {
    expect(namedTitle("Linear vs Jira")).toBe("Linear vs Jira — Ali Azam Kazmi");
  });

  it("drops the name whole rather than clipping it", () => {
    expect(namedTitle("How to write a PRD for a feature that can be wrong")).toBe(
      "How to write a PRD for a feature that can be wrong",
    );
  });

  it("gives every article a title under 63 characters with no half-words", () => {
    for (const t of [...hostedWriting, ...fieldNotes].map((x) => namedTitle(x.title))) {
      expect(t.length, t).toBeLessThanOrEqual(62);
      expect(t, t).not.toMatch(/…$/);
    }
  });
});

describe("jsonLd", () => {
  it("serialises one graph as an object and several as an array", () => {
    expect(JSON.parse(jsonLd({ a: 1 }))).toEqual({ a: 1 });
    expect(JSON.parse(jsonLd({ a: 1 }, { b: 2 }))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("cannot close its own <script> tag", () => {
    // It is written into <script type="application/ld+json"> with
    // dangerouslySetInnerHTML: a "</script>" inside a string would end the
    // block and the rest would be parsed as HTML.
    const out = jsonLd({ headline: "Escaping </script><script>alert(1)</script>" });
    expect(out).not.toMatch(/<\/script/i);
    expect(out).not.toContain("<");
    expect(JSON.parse(out).headline).toBe("Escaping </script><script>alert(1)</script>");
  });
});

describe("Person and WebSite entities", () => {
  const person = personJsonLd();
  const site = websiteJsonLd();

  it("tie together by @id", () => {
    expect(person["@id"]).toBe(`${siteUrl}/#person`);
    expect(site.author).toEqual({ "@id": person["@id"] });
    expect(site.publisher).toEqual({ "@id": person["@id"] });
  });

  it("names the person the way a search does", () => {
    expect(person.name).toBe("Ali Azam Kazmi");
    expect(person.alternateName).toContain("Ali Kazmi");
    expect(new Set(person.alternateName).size).toBe(person.alternateName.length);
  });

  it("corroborates the entity with absolute, unique, https profiles", () => {
    expect(person.sameAs.length).toBeGreaterThanOrEqual(3);
    for (const href of person.sameAs) expect(href).toMatch(/^https:\/\/[^\s]+$/);
    expect(new Set(person.sameAs).size).toBe(person.sameAs.length);
  });

  it("points its image at the site's own origin", () => {
    expect(person.image.startsWith(siteUrl + "/")).toBe(true);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers from 1 and uses absolute URLs", () => {
    const b = breadcrumbJsonLd([
      { name: "Home", path: "" },
      { name: "Missions", path: "/missions" },
    ]);
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(b.itemListElement[1].item).toBe(`${siteUrl}/missions`);
  });
});

describe("Article word counts", () => {
  it("count words, not markup, for hosted writing", () => {
    for (const p of hostedWriting) {
      const ld = pieceJsonLd(p);
      expect(ld.wordCount).toBe(words(plainBody(p.body ?? [])));
      expect(ld.wordCount).toBeGreaterThan(300);
    }
  });

  it("count words, not markup, for field notes", () => {
    for (const n of fieldNotes) {
      const ld = noteJsonLd(n);
      expect(ld.wordCount).toBe(words(plainBody(n.body)));
      expect(ld.wordCount).toBeGreaterThan(300);
    }
  });

  it("carry a valid publication date", () => {
    for (const p of hostedWriting) expect(Number.isNaN(Date.parse(pieceJsonLd(p).datePublished))).toBe(false);
    for (const n of fieldNotes) if (n.published) expect(Number.isNaN(Date.parse(n.published))).toBe(false);
  });
});

describe("faqJsonLd", () => {
  it("gives every question a non-empty answer", () => {
    const ld = faqJsonLd(faqs);
    expect(ld.mainEntity.length).toBe(faqs.length);
    for (const q of ld.mainEntity) {
      expect(q.name.trim().endsWith("?")).toBe(true);
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(40);
    }
  });
});
