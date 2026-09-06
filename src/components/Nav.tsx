"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { lockScroll } from "@/lib/lenis";
import NavOverview from "./NavOverview";
import styles from "./Nav.module.scss";

// `plain` is what the label means if you ignore the metaphor entirely.
const routes = [
  { href: "/missions", label: "Missions", plain: "Projects" },
  { href: "/galaxy", label: "Galaxy 3D", plain: "Interactive Map" },
  { href: "/lab", label: "Lab", plain: "Experiments" },
  { href: "/orbit", label: "Orbit", plain: "Interests" },
  { href: "/field-notes", label: "Field Notes", plain: "Writing" },
  { href: "/about", label: "About", plain: "About" },
  { href: "/mission-history", label: "Mission History", plain: "Resume" },
  { href: "/contact", label: "Open Channel", plain: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const railRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  /*
   * Scroll state + progress rail.
   *
   * The rail is written straight to a transform on the element rather than
   * through React state — progress changes on every scroll frame, and
   * re-rendering the whole nav that often is exactly how a sticky header
   * starts costing frames. Only the boolean `scrolled` goes through state,
   * and that flips at most twice per page.
   */
  useEffect(() => {
    let raf = 0;

    const read = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const y = doc.scrollTop;

      setScrolled((prev) => {
        const next = y > 48;
        return next === prev ? prev : next;
      });

      if (railRef.current) {
        railRef.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Lock the page behind the overlay, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lockScroll(true); // overflow:hidden alone does not stop Lenis
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const here = routes.find((r) => isActive(r.href))?.label ?? "Home";

  return (
    <header
      className={styles.bar}
      data-scrolled={scrolled || undefined}
    >
      <nav className={styles.inner} aria-label="Primary">
        {/*
         * ONE panel, not four.
         *
         * This used to be four separately-bordered modules with transparent
         * gaps between them, and only the modules carried a fill — so page
         * content ran straight through the gaps and the bar read as loose
         * chiclets floating over the page rather than as an instrument docked
         * to it. It is now a single surface divided by hairlines, which is the
         * same panel language the rest of the site uses.
         */}
        <div className={styles.dock}>
          {/* Reading progress, drawn along the dock's own top edge. */}
          <span className={styles.rail} aria-hidden="true">
            <span ref={railRef} className={styles.railFill} />
          </span>

          {/* Live signal. Decorative, so it is hidden from AT. */}
          <span className={styles.status} aria-hidden="true">
            <span className={styles.statusDot} />
          </span>

          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>AAK</span>
            <span className={styles.brandName}>Ali Azam Kazmi</span>
          </Link>

          {/* Where you are. The full map lives behind the Overview control —
              a bar cannot hold eight routes plus ten missions without
              truncating, and truncation is what buries the work.

              Carries its own "AT" label now: as a bare uppercase mono word
              sitting between the brand and a link, it read as another nav
              item you could click. */}
          <span className={styles.here} aria-hidden="true">
            <span className={styles.hereLabel}>At</span>
            <span className={styles.hereValue}>{here}</span>
          </span>

          {/* Contact is promoted out of the list into the trailing action. */}
          <Link
            href="/contact"
            className={styles.cta}
            aria-current={isActive("/contact") ? "page" : undefined}
          >
            Open Channel
          </Link>

          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="nav-overview"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.toggleGlyph} data-open={open || undefined} aria-hidden="true">
              <i />
              <i />
            </span>
            {open ? "Close" : "Overview"}
          </button>

          {/* Straight to the resume. */}
          <a
            className={styles.resume}
            href="/Ali_Azam_Kazmi_.pdf"
            target="_blank"
            rel="noreferrer noopener"
            // aria-label stays plain for screen readers; the visible tooltip
            // is the one place on the site allowed to editorialise.
            aria-label="Open resume as PDF"
            title="The paper trail (PDF, opens honestly)"
          >
            <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </nav>

      {open ? (
        <NavOverview
          routes={routes}
          isActive={isActive}
          here={here}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </header>
  );
}
