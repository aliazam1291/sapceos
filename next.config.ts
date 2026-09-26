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

  /*
   * Security headers (2026-09-23). Ali: "we need to protect the website
   * too." What is actually protectable on a public static site: stop other
   * people framing it, stop the browser guessing content types, stop
   * referrers leaking full URLs, keep the browser on HTTPS, turn off device
   * APIs this site never uses, and constrain where scripts, styles and
   * connections may come from.
   *
   * The CSP allows 'unsafe-inline' for scripts and styles, which is not
   * theatre-free but is the honest trade here: Next's hydration bootstrap
   * and every JSON-LD block are inline, React writes inline styles for the
   * ship and the bars, and the nonce alternative forces every route to
   * render dynamically — which would cost the static delivery the whole
   * site is built around. What it still buys: no third-party script origin
   * can execute, no external form target, no data: or remote iframes, and
   * connections are limited to this origin and Vercel's telemetry.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },

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
      // /smaak is a real page now (2026-09-26) — the studio's own, branded.
      // Its redirect to /studio had to go or it would have shadowed the
      // route entirely; only the hyphenated spelling still redirects, and
      // it now points at the new page rather than the deck.
      { source: "/smaak-ux", destination: "/smaak", permanent: true },
    ];
  },
};

export default nextConfig;
