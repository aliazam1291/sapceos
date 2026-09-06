import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run to its own directory while `next dev` keeps
  // serving from .next, so verifying a build never interrupts the dev server.
  distDir: process.env.BUILD_DIR || ".next",

  // This repo's CLAUDE.md is hand-written; Next must not regenerate over it.
  agentRules: false,

  // Preserve SEO equity from the pre-Space-OS URL structure.
  async redirects() {
    return [
      { source: "/work", destination: "/missions", permanent: true },
      { source: "/work/:slug", destination: "/missions/:slug", permanent: true },
      { source: "/case-studies", destination: "/missions", permanent: true },
      { source: "/case-studies/:slug", destination: "/missions/:slug", permanent: true },
      { source: "/blog", destination: "/field-notes", permanent: true },
      { source: "/blog/:slug", destination: "/field-notes/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
