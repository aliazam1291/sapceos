"use client";

import { motion, useReducedMotion } from "motion/react";
import LocalTime from "@/components/LocalTime";
import GlowCard from "./GlowCard";
import { profile } from "@/content/profile";

/**
 * The hero's right column: a readout of the operator.
 *
 * Every row is a fact from content/profile.ts — no invented metrics, no fake
 * console output. The space framing is in the labels and the layout, not in
 * pretending to be a NASA terminal.
 */

const rows: Array<{ k: string; v: string }> = [
  { k: "Operator", v: profile.name },
  { k: "Role", v: profile.currentRole },
  { k: "Station", v: profile.currentOrg },
  { k: "Since", v: "Sep 2024" },
  { k: "Base", v: profile.location },
];

export default function SystemPanel() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[26rem]"
    >
      <GlowCard className="p-5 sm:p-6" radius={300}>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[#5a5a5a]">
            Operator readout
          </span>
          <span className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[#22d0b2]">
            <span className="relative flex h-1.5 w-1.5">
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22d0b2] opacity-70" />
              )}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22d0b2]" />
            </span>
            Live
          </span>
        </div>

        <dl className="mt-4 grid gap-3">
          {rows.map((r) => (
            <div key={r.k} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[#5a5a5a]">
                {r.k}
              </dt>
              <dd className="text-[0.9375rem] leading-snug text-[#f5f5f5]">{r.v}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3">
            <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[#5a5a5a]">
              Local
            </dt>
            <dd className="font-mono text-[0.9375rem] text-[#8c8c8c]">
              <LocalTime />
            </dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[#5a5a5a]">
            Disciplines
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Frontend", "UI/UX", "Product"].map((t) => (
              <span
                key={t}
                className="rounded-[3px] border border-[rgba(34,208,178,0.28)] bg-[rgba(34,208,178,0.07)] px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[#22d0b2]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}
