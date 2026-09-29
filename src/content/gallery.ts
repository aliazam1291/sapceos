/*
 * What hangs in the dome on /smaak (2026-09-27). Ali: "we need a gallery
 * kinda thing, like a dome gallery in smaak.ux … my designs from Figma and
 * Behance displayed."
 *
 * Every image is one Ali made. The Behance covers were downloaded to
 * public/studio at his instruction (2026-09-19); the two site captures are
 * screenshots of the live sites he built, taken 2026-09-27. Textures are the
 * 640px WebP bakes in public/studio/dome (tools/studio-textures.mjs) — the
 * originals are 6.7 MB and would be a hero-image budget spent on a
 * decoration.
 *
 * `href` is where the piece can actually be seen in full: the Behance
 * gallery, or the live site. Nothing here claims an outcome. The Behance
 * pieces that are also on /studio take their link from studio.ts, so there
 * is one copy of each URL.
 */
import { studioPieces } from "./studio";

const behanceOf = (slug: string) => studioPieces.find((p) => p.slug === slug)?.behance;

export type GalleryItem = {
  /** 640px WebP under public/studio/dome. */
  texture: string;
  title: string;
  /** What it is, in three or four words. */
  kind: string;
  /** Behance gallery or the live site. */
  href?: string;
  /** Client work, or Ali's own. */
  client?: string;
};

export const gallery: GalleryItem[] = [
  {
    texture: "/studio/dome/sunder-masala-site.webp",
    title: "Sunder Masala",
    kind: "Website, content & branding",
    client: "Sunder Masala",
    href: "https://www.sundermasala.com/",
  },
  {
    texture: "/studio/dome/wolf-casa-site.webp",
    title: "Wolf Casa",
    kind: "Website, content & branding",
    client: "Wolf Casa",
    href: "https://www.wolfcasa.in/",
  },
  {
    texture: "/studio/dome/leanmultiverse-logo-and-branding.webp",
    title: "Lean Multiverse",
    kind: "Logo & branding",
    client: "Lean Multiverse",
    href: "https://www.behance.net/gallery/241373065/Leanmultiverse-Logo-Branding",
  },
  {
    texture: "/studio/dome/web3-nft-marketplace-ui-multi-page-figma.webp",
    title: "Web3 NFT marketplace",
    kind: "Multi-page UI · Figma",
    href: behanceOf("web3-nft-marketplace"),
  },
  {
    texture: "/studio/dome/dark-health-dashboard-ui.webp",
    title: "Health dashboard",
    kind: "Dark product UI",
    href: behanceOf("health-dashboard"),
  },
  {
    texture: "/studio/dome/tedx-srmist-web-design-app-design.webp",
    title: "TEDxSRMIST",
    kind: "Web & app design",
    href: behanceOf("tedx-srmist"),
  },
  {
    texture: "/studio/dome/talent-connect-logo-brand-identity-visua.webp",
    title: "Talent Connect",
    kind: "Logo & visual identity",
    href: behanceOf("talent-connect"),
  },
  {
    texture: "/studio/dome/ar-vr-web-design-map-ar-vr.webp",
    title: "AR/VR map",
    kind: "Spatial web design",
    href: behanceOf("ar-vr-map"),
  },
  {
    texture: "/studio/dome/rois-logo-clothing-brand.webp",
    title: "Rois",
    kind: "Clothing brand identity",
    href: behanceOf("rois"),
  },
  {
    texture: "/studio/dome/dumb-money.webp",
    title: "DumbMoney",
    kind: "Brand concept",
    href: "https://www.behance.net/gallery/217772229/Dumb-Money",
  },
  {
    texture: "/studio/dome/vivo-mood-board-ui-inspiration-design-mo.webp",
    title: "Vivo mood board",
    kind: "UI inspiration board",
    href: "https://www.behance.net/gallery/223882033/Vivo-Mood-Board-UI-Inspiration-Design-Mood-Board",
  },
  {
    texture: "/studio/dome/poster-illustration.webp",
    title: "Poster illustration",
    kind: "Print",
    href: "https://www.behance.net/gallery/219730511/Poster-illustration",
  },
  {
    texture: "/studio/dome/a3-poster.webp",
    title: "A3 poster",
    kind: "Print",
    href: "https://www.behance.net/gallery/217777301/A3-Poster",
  },
  {
    texture: "/studio/dome/independence-day-template.webp",
    title: "Independence Day",
    kind: "Campaign template",
    href: "https://www.behance.net/gallery/228917555/Independence-Day-Template",
  },
];
