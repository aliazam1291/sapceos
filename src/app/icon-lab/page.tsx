import { notFound } from "next/navigation";
import IconLab from "./IconLab";

/*
 * The icon lab (2026-09-20) — dev only. Renders the site's own objects (the
 * ship, the relay, a gas giant, a world) on transparent canvases so
 * tools/icons-build.mjs can photograph them into public/icons/*.png: the 3D
 * icon set Ali asked for ("use 3D icons related to space"), drawn from the
 * same models the pages fly, not a stock pack. 404 in production.
 */
export const metadata = { robots: { index: false, follow: false } };

export default function IconLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <IconLab />;
}
