import { ImageResponse } from "next/og";
import { lookingFor, openTo, profile } from "@/content/profile";
import { results } from "@/content/results";

export const runtime = "edge";
export const alt = `${profile.name}: the recruiter brief. ${lookingFor}.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * The recruiter brief's own share card (2026-11-12). Recruiters do not find
 * a portfolio by browsing; the link reaches them in a LinkedIn message, an
 * application form, an email or a WhatsApp forward, and what they see first
 * is the unfurl. /hire used the site's cover (a ship and "Space OS"), which
 * says nothing a recruiter screens for. This one says who, what role, where,
 * and four measured numbers: the same four the page's readout counts, read
 * from results.ts, so the card cannot claim what the page does not.
 */

const pick = (source: string, label: RegExp) => results.find((r) => r.source.startsWith(source) && label.test(r.label));
const numbers = [
  pick("Vahan Shakti", /Users/),
  pick("Mappls Shop", /Collections/),
  pick("Mappls Shop", /manual ops/),
  pick("IOCL GeoRTD", /Routes/),
].filter((r): r is NonNullable<typeof r> => Boolean(r));

const short: Record<string, string> = {
  Users: "users on one platform",
  "Collections, vs the manual process": "collections",
  "Less manual ops work, billing & accounts": "less manual ops work",
  "Routes injected": "routes injected",
};

export default async function HireCard() {
  const ship = await fetch(new URL("../og-ship.png", import.meta.url)).then((r) => r.arrayBuffer());
  const shipSrc = `data:image/png;base64,${Buffer.from(ship).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          background: "radial-gradient(ellipse at 18% 0%, #0f2a20 0%, #060606 58%)",
          color: "#f2f5f8",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shipSrc} width={330} height={330} alt="" style={{ position: "absolute", right: 40, top: 6, opacity: 0.9 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, letterSpacing: 4, color: "#3cdd9e" }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ff3d2e" }} />
          RECRUITER BRIEF · OPEN TO ROLES
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>{profile.name}</div>
          <div style={{ fontSize: 34, color: "#f2f5f8", letterSpacing: -0.5 }}>{profile.title}</div>
          {/* One string: the renderer refuses a div with several text
              children unless it is a flex box (the first build 500'd). */}
          <div style={{ fontSize: 28, color: "#8e9aa8" }}>{`Looking for ${lookingFor}. ${openTo}.`}</div>
        </div>

        <div style={{ display: "flex", borderTop: "1px solid rgba(190,230,215,0.22)", paddingTop: 26 }}>
          {numbers.map((n, i) => (
            <div
              key={n.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
                paddingLeft: i ? 28 : 0,
                borderLeft: i ? "1px solid rgba(190,230,215,0.14)" : "none",
              }}
            >
              <div style={{ fontSize: 46, fontWeight: 600, color: "#3cdd9e", letterSpacing: -1 }}>{n.value}</div>
              <div style={{ fontSize: 19, color: "#8e9aa8" }}>{short[n.label] ?? n.label}</div>
              <div style={{ fontSize: 16, letterSpacing: 2, color: "#5b6674" }}>{n.source.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
