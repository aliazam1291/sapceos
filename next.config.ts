import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run to its own directory while `next dev` keeps
  // serving from .next, so verifying a build never interrupts the dev server.
  distDir: process.env.BUILD_DIR || ".next",

  // This repo's CLAUDE.md is hand-written; Next must not regenerate over it.
  agentRules: false,

  // `experimental.inlineCss` was tried here (2026-09-19) to remove the four
  // render-blocking stylesheet requests and rejected: Next also serialises
  // the inlined CSS into the RSC flight payload (twice), so /missions went
  // from 29 KiB to 119 KiB gzipped and mobile FCP from 1.2 s to 4.5 s.
  // Four small stylesheets are the cheaper side of that trade.

  // Preserve SEO equity from the pre-Space-OS URL structure.
  async redirects() {
    return [
      { source: "/work", destination: "/missions", permanent: true },
      { source: "/work/:slug", destination: "/missions/:slug", permanent: true },
      { source: "/case-studies", destination: "/missions", permanent: true },
      { source: "/case-studies/:slug", destination: "/missions/:slug", permanent: true },
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/:slug", destination: "/field-notes/:slug", permanent: true },
      // The URLs people guess (and an external SEO audit proposed), mapped
      // onto the places that exist (2026-09-20).
      { source: "/projects", destination: "/missions", permanent: true },
      { source: "/projects/:slug", destination: "/missions/:slug", permanent: true },
      { source: "/experience", destination: "/mission-history", permanent: true },
      { source: "/resume", destination: "/Ali_Azam_Kazmi_.pdf", permanent: false },
      { source: "/cv", destination: "/Ali_Azam_Kazmi_.pdf", permanent: false },
      { source: "/smaak-ux", destination: "/studio", permanent: true },
      { source: "/smaak", destination: "/studio", permanent: true },
    ];
  },
};

export default nextConfig;
