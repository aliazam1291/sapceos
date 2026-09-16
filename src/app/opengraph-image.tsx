import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const runtime = "edge";
export const alt = `${profile.name} — ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * The site's share card. Generated, not a screenshot: a screenshot of a
 * WebGL galaxy at 1200×630 is a dark smear in a link preview. This is the
 * HUD language — mono label, big name, a horizon line, one emerald mark —
 * and it reads at thumbnail size in a LinkedIn or Slack unfurl.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(ellipse at 20% 0%, #0f2a20 0%, #060606 55%)",
          color: "#f2f5f8",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, letterSpacing: 4, color: "#3cdd9e" }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#3cdd9e" }} />
          SPACE OS · MISSION CONTROL
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 88, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>{profile.name}</div>
          <div style={{ fontSize: 36, color: "#8e9aa8", letterSpacing: -0.5 }}>{profile.title}</div>
          <div style={{ fontSize: 30, color: "#f2f5f8", marginTop: 6 }}>{profile.oneLine}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 40, fontSize: 20, letterSpacing: 3, color: "#8e9aa8" }}>
            <span>200,000+ USERS</span>
            <span>5+ LIVE PLATFORMS</span>
            <span>NEW DELHI</span>
          </div>
          <div style={{ width: 360, height: 2, background: "linear-gradient(90deg, transparent, #3cdd9e)" }} />
        </div>
      </div>
    ),
    size,
  );
}
