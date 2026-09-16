import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/* The tab mark: the site's "N" brand glyph on black with the emerald signal. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060606",
          borderRadius: 14,
          border: "2px solid #1f2a26",
          color: "#3cdd9e",
          fontSize: 38,
          fontWeight: 700,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          letterSpacing: -2,
        }}
      >
        N
      </div>
    ),
    size,
  );
}
