import type { Metadata } from "next";
import { genreKeywords, identityKeywords, keywordsFor } from "@/lib/keywords";
import Link from "next/link";
import Crumbs from "@/components/Crumbs";
import GalaxyClientLoader from "./GalaxyClientLoader";
import styles from "./galaxyPage.module.scss";

export const metadata: Metadata = {
  title: "Galaxy — Interactive 3D Map of the Work",
  description: "An interactive WebGL galaxy where every star system is one of Ali Azam Kazmi's products. Fly between missions, open their reports.",
  keywords: keywordsFor(genreKeywords, identityKeywords),
  alternates: { canonical: "/galaxy" },
  // Thin by nature (2026-11-18, SEO audit: 12 words of text): an interactive
  // map of the same projects /missions lists in full. Kept for visitors, out
  // of the index and the sitemap; its links are still followed.
  robots: { index: false, follow: true },
};

export default function GalaxyPage() {
  return (
    // A <div>, not <main>: the root layout already wraps children in
    // <main id="main">, and nesting a second one is invalid HTML that also
    // gives assistive tech two competing main landmarks.
    <div className={styles.mainContainer}>
      <Crumbs name="Galaxy map" path="/galaxy" />
      <header className={styles.topBanner}>
        <Link href="/" className={styles.backLink}>
          &larr; Return to Base
        </Link>
        <h1 className={styles.headerTitle}>GALAXY EXPLORER</h1>
        <div className={styles.telemetryTag}>3D SYSTEM MAP</div>
      </header>

      <div className={styles.galaxyWrap}>
        <GalaxyClientLoader />
      </div>
    </div>
  );
}
