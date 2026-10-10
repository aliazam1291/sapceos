import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/*
 * AI discovery (2026-10-04). Ali: be listed on the AI platforms. There is no
 * submission form for any of them; being found means not being blocked and
 * saying so. The default `*` rule already allows everything, but a named
 * allow per crawler is explicit and survives anyone later tightening `*`.
 *
 * Two kinds, deliberately both allowed:
 *  - search / answer crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
 *    Claude-User, PerplexityBot, Perplexity-User): fetch a page so an answer
 *    can cite it. This is the listing.
 *  - training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
 *    CCBot): a separate choice. Allowed because this is a public portfolio
 *    whose goal is to be known; to opt out of training only, move these to
 *    `disallow: "/"` and leave the first group alone.
 */
const searchBots = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];
const trainingBots = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: searchBots, allow: "/" },
      { userAgent: trainingBots, allow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
