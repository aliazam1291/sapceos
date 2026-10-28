import { describe, expect, it } from "vitest";
import { BODY_LINK, plainBody } from "@/lib/bodyText";
import { sectionSlug } from "@/lib/slug";

const matches = (s: string) => [...s.matchAll(BODY_LINK)].map((m) => [m[1], m[2]]);

describe("body link markup", () => {
  it("matches https links and site paths", () => {
    expect(matches("See [the missions](/missions) and [Behance](https://www.behance.net/aliak8).")).toEqual([
      ["the missions", "/missions"],
      ["Behance", "https://www.behance.net/aliak8"],
    ]);
  });

  it("leaves anything else literal — no javascript:, data: or protocol-relative links", () => {
    expect(matches("[x](javascript:alert(1))")).toEqual([]);
    expect(matches("[x](data:text/html,hi)")).toEqual([]);
    expect(matches("[x](//evil.example)")).toEqual([]);
    expect(matches("[x](mailto:a@b.c)")).toEqual([]);
  });
});

describe("plainBody", () => {
  it("drops subhead markers and reduces links to their labels", () => {
    expect(plainBody(["## The learning", "### An entry", "Read [the PRD](/missions/x) first."])).toBe(
      "The learning An entry Read the PRD first.",
    );
  });
});

describe("sectionSlug", () => {
  it("makes stable anchor ids", () => {
    expect(sectionSlug("What I would measure")).toBe("what-i-would-measure");
    expect(sectionSlug("UX & UI")).toBe("ux-ui");
  });
});
