import { describe, expect, it } from "vitest";
import { isSearchReferrer } from "@/lib/referrer";

describe("isSearchReferrer", () => {
  it("recognises the search and answer engines", () => {
    for (const r of [
      "https://www.google.com/",
      "https://www.google.co.in/",
      "https://www.bing.com/search?q=ali+azam+kazmi",
      "https://duckduckgo.com/",
      "https://search.brave.com/",
      "https://www.perplexity.ai/",
      "https://chatgpt.com/",
      "https://yandex.ru/",
    ])
      expect(isSearchReferrer(r), r).toBe(true);
  });

  it("does not treat a shared link, the site itself or a lookalike as search", () => {
    for (const r of [
      "",
      "https://www.linkedin.com/",
      "https://aliazamkazmi.vercel.app/about",
      "https://google.evil.example/",
      "https://notgoogle.com/",
      "not a url",
    ])
      expect(isSearchReferrer(r), r).toBe(false);
  });
});
