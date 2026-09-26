"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { missions } from "@/content/missions";
import { fieldNotes } from "@/content/field-notes";
import { labEntries } from "@/content/lab";
import { studioPieces, studioKindLabel } from "@/content/studio";
import { links, profile } from "@/content/profile";
import { palette as voice } from "@/content/voice";
import { lockScroll } from "@/lib/lenis";
import { sfx } from "@/lib/spaceSound";
import styles from "./CommandPalette.module.scss";

/**
 * Mission control — the command palette (2026-09-19).
 *
 * ⌘K / Ctrl+K anywhere, or the "⌘K" key in the dock. One field, every
 * destination on the site: pages, the ten missions, the six notes, the lab
 * bench, the résumé and the channel. Type a few letters and go. It is the
 * instrument version of a site search: a wireframe panel with a prompt, a
 * numbered manifest and the key legend along the foot — the same panel
 * language as the boot log and the Overview, not a floating card.
 *
 * Semantics: a modal dialog holding a combobox over a listbox. Arrow keys
 * move the active option, Enter follows it, Escape closes; focus returns
 * to whatever had it. The page behind is scroll-locked (Lenis and native).
 * Selecting fires `space:warp` first so the ship departs ahead of the
 * route change, the same as any link.
 */

type Kind = "page" | "mission" | "note" | "studio" | "lab" | "channel";
type Entry = {
  id: string;
  kind: Kind;
  label: string;
  meta?: string;
  href: string;
  external?: boolean;
  /** Full navigation, not a client route change (the boot screen mounts on load). */
  reload?: boolean;
  /** Extra words the match may hit that are not shown. */
  keywords?: string;
};

const KIND_LABEL: Record<Kind, string> = {
  page: "Pages",
  mission: "Missions",
  note: "Field notes",
  studio: "Studio",
  lab: "Lab",
  channel: "Channel",
};
const KIND_ORDER: Kind[] = ["page", "mission", "note", "studio", "lab", "channel"];
// The 3D marks (public/icons, rendered from the site's own models by
// tools/icons-build.mjs): a group is headed by the object it means — pages
// by the ship, missions by a world, the channel by the relay, the studio by
// the ringed giant. Notes are drones (SVG) and the lab has no model yet.
const KIND_ICON: Partial<Record<Kind, string>> = {
  page: "/icons/ship-128.png",
  mission: "/icons/world-128.png",
  studio: "/icons/giant-128.png",
  channel: "/icons/satellite-128.png",
};

function buildEntries(): Entry[] {
  const pages: Entry[] = [
    { id: "/", kind: "page", label: "Home", meta: "The flight", href: "/", keywords: "start galaxy overview" },
    { id: "/missions", kind: "page", label: "Missions", meta: "Projects · the hangar deck", href: "/missions", keywords: "work projects portfolio" },
    { id: "/field-notes", kind: "page", label: "Field notes", meta: "Case studies · the drone bay", href: "/field-notes", keywords: "case study teardown analysis blog" },
    { id: "/lab", kind: "page", label: "Lab", meta: "Experiments · the bench", href: "/lab", keywords: "open source experiments side projects" },
    { id: "/studio", kind: "page", label: "Studio", meta: "Smaak.ux · freelance work", href: "/studio", keywords: "freelance design brand smaak clients behance figma" },
    { id: "/dumbmoney", kind: "page", label: "DumbMoney", meta: "Venture · Founder & CPO", href: "/dumbmoney", keywords: "dumb money startup coupon deals founder cpo company venture dumbmoney.in" },
    { id: "/writing", kind: "page", label: "Writing", meta: "Essays, guides, a case study", href: "/writing", keywords: "blog medium articles essays posts published" },
    { id: "/decisions", kind: "page", label: "Flight rules", meta: "How I decide", href: "/decisions", keywords: "decisions principles judgement" },
    { id: "/flight-data", kind: "page", label: "Flight data", meta: "The portfolio, measured", href: "/flight-data", keywords: "analytics stats statistics data metrics numbers evidence charts" },
    { id: "/faq", kind: "page", label: "Questions", meta: "Common questions, answered", href: "/faq", keywords: "faq questions answers hire availability why product" },
    { id: "/smaak", kind: "page", label: "Smaak.ux", meta: "The design studio", href: "/smaak", keywords: "smaak studio freelance design branding logo client work" },
    { id: "/about", kind: "page", label: "About", meta: "The operator", href: "/about", keywords: "bio profile who" },
    { id: "/mission-history", kind: "page", label: "Mission history", meta: "Résumé · the flight log", href: "/mission-history", keywords: "resume cv experience career" },
    { id: "/galaxy", kind: "page", label: "Galaxy 3D", meta: "The interactive map", href: "/galaxy", keywords: "map explore" },
    { id: "/contact", kind: "page", label: "Open channel", meta: "Contact", href: "/contact", keywords: "contact email hire talk" },
    // The launch screen runs once per tab; this puts it back on.
    { id: "/?launch", kind: "page", label: "Replay the launch sequence", meta: "Pad 01 · pre-flight", href: "/?launch", reload: true, keywords: "boot loading screen launch replay intro start over" },
  ];
  const ms: Entry[] = missions.map((m) => ({
    id: `m:${m.slug}`,
    kind: "mission",
    label: m.title,
    meta: `${m.org} · ${m.status === "active" ? "active" : "shipped"}`,
    href: `/missions/${m.slug}`,
    keywords: [m.premise, ...(m.stack ?? [])].join(" "),
  }));
  const notes: Entry[] = fieldNotes.map((n) => ({
    id: `n:${n.slug}`,
    kind: "note",
    label: n.title,
    meta: n.kind.replace(/-/g, " "),
    href: `/field-notes/${n.slug}`,
    keywords: n.premise,
  }));
  const studioEntries: Entry[] = studioPieces.map((p) => ({
    id: `s:${p.slug}`,
    kind: "studio",
    label: p.title,
    meta: `${studioKindLabel[p.kind]} · ${p.status}`,
    href: "/studio",
    keywords: [p.brief, p.client ?? "", "smaak freelance design"].join(" "),
  }));
  const lab: Entry[] = labEntries.map((e, i) => ({
    id: `l:${i}`,
    kind: "lab",
    label: e.title,
    meta: e.status.replace(/-/g, " "),
    href: "/lab",
    keywords: [e.premise, ...e.stack].join(" "),
  }));
  const channel: Entry[] = [
    { id: "c:resume", kind: "channel", label: "Résumé (PDF)", meta: "Opens in a new tab", href: "/Ali_Azam_Kazmi_.pdf", external: true, keywords: "cv download paper" },
    { id: "c:email", kind: "channel", label: "Send a message", meta: profile.email, href: `mailto:${profile.email}`, external: true, keywords: "email mail write" },
    { id: "c:slot", kind: "channel", label: "Book a slot", meta: "Calendly", href: profile.calendly, external: true, keywords: "call meeting calendar schedule" },
    ...links.map((l) => ({ id: `c:${l.href}`, kind: "channel" as Kind, label: l.label, meta: l.href.replace(/^https?:\/\//, ""), href: l.href, external: true })),
  ];
  return [...pages, ...ms, ...notes, ...studioEntries, ...lab, ...channel];
}

/**
 * Match score: exact prefix on the label wins, then a substring in the
 * label, then a substring in meta/keywords, then a subsequence (the letters
 * in order, "vsh" for Vahan Shakti). Zero means no match.
 */
function score(entry: Entry, q: string): number {
  if (!q) return 1;
  const label = entry.label.toLowerCase();
  const hay = `${label} ${entry.meta ?? ""} ${entry.keywords ?? ""}`.toLowerCase();
  if (label.startsWith(q)) return 100 - label.length * 0.1;
  if (label.includes(q)) return 80 - label.indexOf(q) * 0.5;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => hay.includes(w))) return 60;
  if (hay.includes(q)) return 50;
  let i = 0;
  for (const ch of label) if (ch === q[i]) i++;
  if (i === q.length) return 20 - label.length * 0.05;
  return 0;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const entries = useMemo(buildEntries, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const scored = entries
      .map((e) => ({ e, s: score(e, needle) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || KIND_ORDER.indexOf(a.e.kind) - KIND_ORDER.indexOf(b.e.kind));
    const picked = needle ? scored.slice(0, 12) : scored;
    // Group headings only when the list is unfiltered — a search result is
    // a ranking, and headings would break the rank.
    return { flat: picked.map((x) => x.e), grouped: !needle };
  }, [entries, q]);

  const close = useCallback(() => {
    setOpen(false);
    sfx("close");
  }, []);

  const go = useCallback(
    (entry: Entry) => {
      setOpen(false);
      sfx("click");
      if (entry.external) {
        window.open(entry.href, "_blank", "noreferrer,noopener");
        return;
      }
      if (entry.reload) {
        window.dispatchEvent(new Event("space:warp"));
        window.setTimeout(() => location.assign(entry.href), 120);
        return;
      }
      if (entry.href !== location.pathname) window.dispatchEvent(new Event("space:warp"));
      router.push(entry.href);
    },
    [router],
  );

  // Global keys: ⌘K / Ctrl+K toggles; "/" opens when nothing is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (k === "/" && !open) {
        const t = e.target as HTMLElement | null;
        const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
        if (typing) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("space:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("space:palette", onOpen);
    };
  }, [open]);

  // Open: remember focus, lock the page, focus the prompt. Close: restore.
  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    setQ("");
    setActive(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lockScroll(true);
    const id = window.setTimeout(() => input.current?.focus(), 20);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prev;
      lockScroll(false);
      restoreTo.current?.focus?.();
    };
  }, [open]);

  // Keep the active option in view as the arrows move it.
  useEffect(() => {
    if (!open) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => setActive(0), [q]);
  // A tick as the arrows move the active option.
  useEffect(() => {
    if (open && flatLen.current > 0) sfx("tick");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  const flatLen = useRef(0);

  if (!open) return null;

  const flat = results.flat;
  flatLen.current = flat.length;
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = flat[active];
      if (entry) go(entry);
    } else if (e.key === "Tab") {
      // The dialog is one field and one list; Tab stays inside.
      e.preventDefault();
    }
  };

  let lastKind: Kind | null = null;

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && close()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Mission control">
        <div className={styles.head}>
          <span className={styles.callsign} aria-hidden="true">
            CAPCOM
          </span>
          <span className={styles.prompt} aria-hidden="true">
            &gt;
          </span>
          <input
            ref={input}
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-activedescendant={flat[active] ? `palette-opt-${active}` : undefined}
            aria-autocomplete="list"
            aria-label="Go to"
            autoComplete="off"
            spellCheck={false}
            placeholder={voice.prompt}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className={styles.esc} aria-hidden="true">
            esc
          </kbd>
        </div>

        <ul ref={list} id="palette-listbox" role="listbox" aria-label="Destinations" className={styles.list}>
          {flat.length === 0 ? (
            <li className={styles.empty} role="presentation">
              <span className={styles.callsign}>CAPCOM</span> {voice.nothing}
            </li>
          ) : (
            flat.map((entry, i) => {
              const heading = results.grouped && entry.kind !== lastKind ? KIND_LABEL[entry.kind] : null;
              lastKind = entry.kind;
              return (
                <li key={entry.id} role="presentation" className={styles.row}>
                  {heading ? (
                    <span className={styles.group} aria-hidden="true">
                      {KIND_ICON[entry.kind] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={KIND_ICON[entry.kind]} alt={KIND_LABEL[entry.kind]} width={28} height={28} className={styles.groupIcon} loading="lazy" decoding="async" />
                      ) : null}
                      {heading}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    id={`palette-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    data-kind={entry.kind}
                    className={styles.option}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(entry)}
                    tabIndex={-1}
                  >
                    <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.label}>{entry.label}</span>
                    {entry.meta ? <span className={styles.meta}>{entry.meta}</span> : null}
                    <span className={styles.go} aria-hidden="true">
                      {entry.external ? "↗" : "↵"}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className={styles.foot} aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>↵</kbd> go
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
          <span className={styles.count}>
            {flat.length} {flat.length === 1 ? "destination" : "destinations"}
          </span>
        </div>
      </div>
    </div>
  );
}
