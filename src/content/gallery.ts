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
  /** The full-size image, for the inspection bay (the texture is a 640px bake). */
  full: string;
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
    texture: "/studio/dome/sunder-masala-case.webp",
    full: "/studio/sunder-masala-case.webp",
    title: "Sunder Masala",
    kind: "Brand characters & website",
    client: "Sunder Masala",
    href: behanceOf("sunder-masala"),
  },
  {
    texture: "/studio/dome/wolf-casa-site.webp",
    full: "/studio/wolf-casa-site.png",
    title: "Wolf Casa",
    kind: "Website, content & branding",
    client: "Wolf Casa",
    href: "https://www.wolfcasa.in/",
  },
  {
    texture: "/studio/dome/leanmultiverse-logo-and-branding.webp",
    full: "/studio/leanmultiverse-logo-and-branding.png",
    title: "Lean Multiverse",
    kind: "Logo & branding",
    client: "Lean Multiverse",
    href: "https://www.behance.net/gallery/241373065/Leanmultiverse-Logo-Branding",
  },
  {
    texture: "/studio/dome/web3-nft-marketplace-ui-multi-page-figma.webp",
    full: "/studio/web3-nft-marketplace-ui-multi-page-figma.png",
    title: "Web3 NFT marketplace",
    kind: "Multi-page UI · Figma",
    href: behanceOf("web3-nft-marketplace"),
  },
  {
    texture: "/studio/dome/dark-health-dashboard-ui.webp",
    full: "/studio/dark-health-dashboard-ui.png",
    title: "Health dashboard",
    kind: "Dark product UI",
    href: behanceOf("health-dashboard"),
  },
  {
    texture: "/studio/dome/tedx-srmist-web-design-app-design.webp",
    full: "/studio/tedx-srmist-web-design-app-design.png",
    title: "TEDxSRMIST",
    kind: "Web & app design",
    href: behanceOf("tedx-srmist"),
  },
  {
    texture: "/studio/dome/talent-connect-logo-brand-identity-visua.webp",
    full: "/studio/talent-connect-logo-brand-identity-visua.png",
    title: "Talent Connect",
    kind: "Logo & visual identity",
    href: behanceOf("talent-connect"),
  },
  {
    texture: "/studio/dome/ar-vr-web-design-map-ar-vr.webp",
    full: "/studio/ar-vr-web-design-map-ar-vr.png",
    title: "AR/VR map",
    kind: "Spatial web design",
    href: behanceOf("ar-vr-map"),
  },
  {
    texture: "/studio/dome/rois-logo-clothing-brand.webp",
    full: "/studio/rois-logo-clothing-brand.png",
    title: "Rois",
    kind: "Clothing brand identity",
    href: behanceOf("rois"),
  },
  {
    texture: "/studio/dome/dumb-money.webp",
    full: "/studio/dumb-money.png",
    title: "DumbMoney",
    kind: "Brand concept",
    href: "https://www.behance.net/gallery/217772229/Dumb-Money",
  },
  {
    texture: "/studio/dome/vivo-mood-board-ui-inspiration-design-mo.webp",
    full: "/studio/vivo-mood-board-ui-inspiration-design-mo.png",
    title: "Vivo mood board",
    kind: "UI inspiration board",
    href: "https://www.behance.net/gallery/223882033/Vivo-Mood-Board-UI-Inspiration-Design-Mood-Board",
  },
  {
    texture: "/studio/dome/poster-illustration.webp",
    full: "/studio/poster-illustration.png",
    title: "Poster illustration",
    kind: "Print",
    href: "https://www.behance.net/gallery/219730511/Poster-illustration",
  },
  {
    texture: "/studio/dome/a3-poster.webp",
    full: "/studio/a3-poster.png",
    title: "A3 poster",
    kind: "Print",
    href: "https://www.behance.net/gallery/217777301/A3-Poster",
  },
  {
    texture: "/studio/dome/independence-day-template.webp",
    full: "/studio/independence-day-template.png",
    title: "Independence Day",
    kind: "Campaign template",
    href: "https://www.behance.net/gallery/228917555/Independence-Day-Template",
  },
];
