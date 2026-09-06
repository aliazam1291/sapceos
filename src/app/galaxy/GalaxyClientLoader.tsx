"use client";

import dynamic from "next/dynamic";

const InteractiveGalaxy = dynamic(
  () => import("@/components/space/InteractiveGalaxy"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030608",
          color: "#22d0b2",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          letterSpacing: "0.15em",
        }}
      >
        INITIALIZING GALAXY SHADER…
      </div>
    ),
  }
);

export default function GalaxyClientLoader() {
  return <InteractiveGalaxy allowFullscreen={false} />;
}
