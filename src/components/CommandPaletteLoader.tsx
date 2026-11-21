"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/*
 * The command palette, loaded when it is first asked for (2026-11-21).
 *
 * CommandPalette searches every mission, field note (bodies included), lab
 * build, studio piece and profile link, and it was mounted in the root
 * layout — so all of that content shipped and was evaluated on every first
 * visit to every page, for a dialog most visitors never open. This stand-in
 * listens for the same three ways in (⌘K / Ctrl+K, "/" when not typing, and
 * `space:palette` from the dock's key), loads the palette on the first one
 * and hands it the open state; from then on the palette's own listeners take
 * over and this stops listening.
 */
const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

export default function CommandPaletteLoader() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (load) return;
    const open = () => setLoad(true);
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        open();
        return;
      }
      if (k === "/") {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("space:palette", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("space:palette", open);
    };
  }, [load]);

  return load ? <CommandPalette initialOpen /> : null;
}
