"use client";

import { useEffect, useState } from "react";
import type { RadioState } from "./Radio";

/**
 * The radio's switch (dock and phone bar): opens or hides the player panel
 * (`Radio`, in the root layout). Lit while the player is mounted, whether
 * or not its panel is showing.
 */
export default function RadioButton({ className }: { className?: string }) {
  const [state, setState] = useState<RadioState>({ mounted: false, open: false });

  useEffect(() => {
    const on = (e: Event) => setState((e as CustomEvent<RadioState>).detail);
    window.addEventListener("space:radio-state", on);
    return () => window.removeEventListener("space:radio-state", on);
  }, []);

  return (
    <button
      type="button"
      className={className}
      data-on={state.mounted || undefined}
      aria-expanded={state.open}
      aria-label={state.open ? "Music: hide the player" : "Music: Back in Black"}
      title={state.mounted ? "Back in Black — show or hide the player" : "Play Back in Black"}
      onClick={() => window.dispatchEvent(new Event("space:radio"))}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 17.5V6l10-2v11.5" />
        <circle cx="6.5" cy="17.5" r="2.5" />
        <circle cx="16.5" cy="15.5" r="2.5" />
      </svg>
    </button>
  );
}
