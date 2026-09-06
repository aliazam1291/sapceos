"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Aceternity's card-spotlight pattern: a radial highlight that tracks the
 * pointer across the card.
 *
 * Written against CSS custom properties rather than React state for the
 * coordinates — re-rendering a card on every pointermove is the usual way this
 * effect turns into jank. State here only tracks hovered/not, which changes
 * at most twice per card.
 */
export default function GlowCard({
  children,
  className,
  radius = 380,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-[4px] border border-white/10",
        "bg-[rgba(14,16,18,0.62)] transition-colors duration-300",
        hovered && "border-[rgba(34,208,178,0.32)]",
        className,
      )}
      style={{ ["--glow-r" as string]: `${radius}px` }}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
          hovered && "opacity-100",
        )}
        style={{
          background:
            "radial-gradient(var(--glow-r) circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(34,208,178,0.10), transparent 62%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
