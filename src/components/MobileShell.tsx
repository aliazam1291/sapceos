"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { profile } from "@/content/profile";
import styles from "./MobileShell.module.scss";

/*
 * The app shell (2026-09-22). Ali: "the site is not at all mobile
 * responsive … same UI but it should look more like a mobile application."
 * Below 768px the page gets what an installed app has and a web page does
 * not: a slim top bar that names the screen, and a tab bar along the bottom
 * thumb-reach edge with the four places a recruiter actually goes plus the
 * full map. The floating command dock (Nav) is a desktop instrument and
 * steps aside at this width; the overview panel it opens is shared — the
 * Menu tab dispatches `space:overview` and Nav toggles it.
 *
 * The top bar's right end is empty on purpose: the companion ship parks
 * there (`Companion` `DOCKED` plan), so on a phone the one ship is docked
 * in the chrome like a status icon instead of flying across a single
 * full-width text column, which is the only air a phone has.
 *
 * Tab icons are the site's own 3D renders (public/icons, from the icon
 * lab): the ship is home, a world is a mission, the landed ship is the
 * operator (Touchdown introduces him), the relay satellite is the open
 * channel. The Menu glyph is wireframe, as instruments are.
 */

const TABS = [
  { href: "/", label: "Home", icon: "/icons/ship-128.png" },
  { href: "/missions", label: "Missions", icon: "/icons/world-128.png" },
  { href: "/about", label: "Operator", icon: "/icons/ship-landed-128.png" },
  { href: "/contact", label: "Channel", icon: "/icons/satellite-128.png" },
] as const;

// What the top bar calls the screen you are on.
const SCREEN: [RegExp, string][] = [
  [/^\/$/, "Space OS"],
  [/^\/missions\/./, "Mission report"],
  [/^\/missions/, "Missions"],
  [/^\/field-notes\/./, "Field note"],
  [/^\/field-notes/, "Field notes"],
  [/^\/writing\/./, "Essay"],
  [/^\/writing/, "Writing"],
  [/^\/lab/, "Lab"],
  [/^\/studio/, "Studio"],
  [/^\/dumbmoney/, "DumbMoney"],
  [/^\/decisions/, "Flight rules"],
  [/^\/about/, "The operator"],
  [/^\/mission-history/, "Mission history"],
  [/^\/contact/, "Open channel"],
  [/^\/galaxy/, "Galaxy"],
];

export default function MobileShell() {
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [overview, setOverview] = useState(false);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      setScrolled((prev) => {
        const next = window.scrollY > 24;
        return next === prev ? prev : next;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Nav owns the overview; it reports its state on <html data-overview>.
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setOverview(html.hasAttribute("data-overview"));
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["data-overview"] });
    sync();
    return () => mo.disconnect();
  }, []);

  const screen = SCREEN.find(([re]) => re.test(pathname))?.[1] ?? "Space OS";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div className={styles.appBar} data-scrolled={scrolled || undefined} role="banner">
        <Link href="/" className={styles.mark} aria-label={`${profile.name} — home`}>
          AAK
        </Link>
        <p className={styles.screen}>
          <span className={styles.screenLabel}>At</span>
          <span className={styles.screenName}>{screen}</span>
        </p>
        <button
          type="button"
          className={styles.search}
          onClick={() => window.dispatchEvent(new Event("space:palette"))}
          aria-label="Search — go anywhere"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M12.8 12.8 17 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        {/* The ship's berth: the companion parks over this space. */}
        <span className={styles.berth} aria-hidden="true" />
      </div>

      <nav className={styles.tabBar} aria-label="Primary (mobile)">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={styles.tab} aria-current={isActive(t.href) ? "page" : undefined} data-active={isActive(t.href) || undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.icon} alt="" width={28} height={28} className={styles.tabIcon} decoding="async" />
            <span className={styles.tabLabel}>{t.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={styles.tab}
          data-active={overview || undefined}
          aria-expanded={overview}
          aria-controls="nav-overview"
          onClick={() => window.dispatchEvent(new Event("space:overview"))}
        >
          <span className={styles.tabGlyph} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className={styles.tabLabel}>{overview ? "Close" : "Menu"}</span>
        </button>
      </nav>
    </>
  );
}
