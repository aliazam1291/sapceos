"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { ui } from "./ui";

/**
 * Level 01 motion: the button leans toward the cursor, then snaps back.
 * Fine pointers only — on touch it is an ordinary link.
 */
export default function MagneticButton({
  href,
  children,
  primary,
  external,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.style.transform = `translate(${dx * 7}px, ${dy * 5}px)`;
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  const className = `${ui.button} ${primary ? ui.buttonPrimary : ""} ${ui.magnetic}`;
  const handlers = { onPointerMove: onMove, onPointerLeave: reset, onBlur: reset };

  if (external) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        {...handlers}
      >
        <span className={ui.buttonLabel}>{children}</span>
      </a>
    );
  }

  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      className={className}
      href={href}
      {...handlers}
    >
      <span className={ui.buttonLabel}>{children}</span>
    </Link>
  );
}
