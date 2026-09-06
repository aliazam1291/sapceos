import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import SectionGuide from "@/components/SectionGuide";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/MotionProvider";
import SmoothScroll from "@/components/SmoothScroll";
import Atmosphere from "@/components/Atmosphere";
import DeepSpace from "@/components/space/DeepSpace";
import Transition from "@/components/Transition";
import { profile } from "@/content/profile";
import { siteUrl } from "@/lib/site";
import "@/styles/tailwind.css";
import "@/styles/globals.scss";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s — ${profile.name}`,
  },
  description:
    "Mission Control for a curious builder. Product engineering, UX strategy and platform work by Ali Azam Kazmi.",
  openGraph: {
    type: "website",
    siteName: `${profile.name} — Space OS`,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
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
              __html: "[data-reveal]{opacity:1!important;transform:none!important}",
            }}
          />
        </noscript>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <MotionProvider />
        <SmoothScroll />
        <DeepSpace />
        <Atmosphere />
        <Transition />
        <Nav />
        <SectionGuide />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
