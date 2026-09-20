import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import SectionGuide from "@/components/SectionGuide";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/MotionProvider";
import SmoothScroll from "@/components/SmoothScroll";
import Atmosphere from "@/components/Atmosphere";
import DeepSpace from "@/components/space/DeepSpace";
import CometCursor from "@/components/space/CometCursor";
import WarpOnNavigate from "@/components/space/WarpOnNavigate";
import CompanionLoader from "@/components/space/CompanionLoader";
import BootScreen from "@/components/BootScreen";
import Transition from "@/components/Transition";
import CommandPalette from "@/components/CommandPalette";
import SoundSystem from "@/components/SoundSystem";
import { profile } from "@/content/profile";
import { siteUrl } from "@/lib/site";
import { jsonLd, personJsonLd, websiteJsonLd } from "@/lib/seo";
import { allKeywords } from "@/lib/keywords";
import "@/styles/tailwind.css";
import "@/styles/globals.scss";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — Product Manager Portfolio · New Delhi`,
    template: `%s — ${profile.name}`,
  },
  description:
    "Ali Azam Kazmi, product engineer and UX strategist, New Delhi: fleet platforms for 200,000+ users, the PRDs behind them, six case studies. Open to PM roles.",
  applicationName: "Space OS",
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  keywords: allKeywords,
  category: "technology",
  classification: "Portfolio; Product Management; UX Design; Software Engineering",
  other: {
    // Geo tags: read by Bing and several directories, harmless elsewhere.
    "geo.region": "IN-DL",
    "geo.placename": "New Delhi",
    "geo.position": "28.6139;77.2090",
    ICBM: "28.6139, 77.2090",
    subject: "Product management, UX strategy and product engineering portfolio",
    audience: "Recruiters, hiring managers, product leaders",
    rating: "general",
    "revisit-after": "7 days",
    designer: profile.name,
    owner: profile.name,
  },
  openGraph: {
    type: "website",
    siteName: `${profile.name} — Space OS`,
    locale: "en_IN",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#060606",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      {/* suppressHydrationWarning: browser extensions (ColorZilla's
          `cz-shortcut-listen`, Grammarly, etc.) add attributes to <body>
          before React hydrates. That is not a mismatch we can fix. */}
      <body suppressHydrationWarning>
        {/* Who this is and what this site is, for machines. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd(), websiteJsonLd()) }}
        />
        {/*
         * Reveal-on-scroll content must survive the script never arriving.
         *
         * The obvious fix — an inline script that flags the document before
         * first paint — mutated `<html>` before React hydrated, and React
         * reported an attribute mismatch on every single route. A <noscript>
         * override is server-rendered, so there is nothing for hydration to
         * disagree with: browsers with JS ignore it entirely, browsers without
         * it apply the rule and read the page.
         */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html:
                "[data-reveal]{opacity:1!important;transform:none!important}[data-nojs]{display:grid!important}",
            }}
          />
        </noscript>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {/* The launch sequence, first visit of a session. */}
        <BootScreen />
        <MotionProvider />
        {/* The room tone and the ship's engines. Opt-in; see SoundToggle. */}
        <SoundSystem />
        <SmoothScroll />
        <DeepSpace />
        <CometCursor />
        <WarpOnNavigate />
        {/* The ship that travels with you, every route. Loaded after first
            paint: it is the only scene that used to ride in the layout bundle. */}
        <CompanionLoader />
        <Atmosphere />
        <Transition />
        <Nav />
        {/* Mission control: ⌘K, every destination from one field. */}
        <CommandPalette />
        <SectionGuide />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
