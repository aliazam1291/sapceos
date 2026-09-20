/**
 * The studio — Smaak.ux, the freelance practice (2023–present).
 *
 * Two kinds of piece, and the page says which is which:
 *   client      — the eight Smaak.ux clients named in PROFILE.md, with the
 *                 deliverable exactly as PROFILE.md states it. Nothing about
 *                 outcomes is written because nothing about outcomes is on
 *                 file; the one measured fact (600K+ followers) is Lean
 *                 Multiverse's audience, not a result of the work.
 *   independent — design work published on Ali's Behance (behance.net/aliak8):
 *                 brand identities, product UI, a student-organisation web
 *                 and app design. Titles are the Behance titles; covers are
 *                 the Behance covers (public/studio). Posters, templates and
 *                 mood boards on the profile are linked, not shown.
 *
 * Every `brief` line is a description of the deliverable, not a claim about
 * what it achieved. If PROFILE.md gains an outcome, it goes here as a
 * `result`, transcribed.
 */
export type StudioKind = "brand" | "product" | "web" | "deck" | "print";

export type StudioPiece = {
  slug: string;
  title: string;
  /** Client name for client work; absent for independent pieces. */
  client?: string;
  kind: StudioKind;
  /** One line: what was made. From PROFILE.md for clients, the Behance title otherwise. */
  brief: string;
  /** Extra fact PROFILE.md states about the client (never inferred). */
  note?: string;
  status: "client" | "independent";
  cover?: string;
  /** The client's logo, where the old site carried one. */
  logo?: string;
  behance?: string;
};

export const studio = {
  name: "Smaak.ux",
  role: "Founder & Product Designer",
  since: 2023,
  /** PROFILE.md: "10+ clients across SaaS, creator brands, e-commerce, home décor, services". */
  clients: 10,
  sectors: ["SaaS", "creator brands", "e-commerce", "home décor", "services"],
  behance: "https://www.behance.net/aliak8",
  figma: "https://www.figma.com/@aliak",
} as const;

export const studioPieces: StudioPiece[] = [
  // ── Client work (PROFILE.md) ──────────────────────────────────────────────
  {
    slug: "lean-multiverse",
    title: "Lean Multiverse",
    client: "Lean Multiverse",
    kind: "brand",
    brief: "Brand identity and web UI for a creator-led brand.",
    note: "600K+ followers",
    status: "client",
    cover: "/studio/leanmultiverse-logo-and-branding.png",
    logo: "/logos/leanmultiverse.svg",
    behance: "https://www.behance.net/gallery/241373065/Leanmultiverse-Logo-Branding",
  },
  {
    slug: "atmos",
    title: "Atmos",
    client: "Atmos",
    kind: "brand",
    brief: "Brand identity.",
    status: "client",
    logo: "/logos/atmos.png",
  },
  {
    slug: "mintair",
    title: "Mintair",
    client: "Mintair",
    kind: "deck",
    brief: "Investor pitch deck.",
    status: "client",
    logo: "/logos/mintair.svg",
  },
  {
    slug: "ravenouxs",
    title: "Ravenouxs",
    client: "Ravenouxs",
    kind: "web",
    brief: "Responsive website.",
    status: "client",
    logo: "/logos/ravenouxs.webp",
  },
  {
    slug: "ekal",
    title: "Ekal",
    client: "Ekal",
    kind: "brand",
    brief: "Brand identity and pitch decks.",
    status: "client",
    logo: "/logos/ekal.png",
  },
  {
    slug: "urban-livin",
    title: "Urban Livin",
    client: "Urban Livin",
    kind: "print",
    brief: "Product catalogues.",
    status: "client",
    logo: "/logos/urbanlivin.png",
  },
  {
    slug: "sorted-blinds",
    title: "Sorted Blinds",
    client: "Sorted Blinds",
    kind: "web",
    brief: "Website.",
    note: "Australia",
    status: "client",
    logo: "/logos/sortedblinds.png",
  },
  {
    slug: "posh-dikur",
    title: "Posh Dikur",
    client: "Posh Dikur",
    kind: "print",
    brief: "Marketing creatives for luxury home décor.",
    status: "client",
    logo: "/logos/poshdikur.png",
  },
  // ── Independent work (Behance) ────────────────────────────────────────────
  {
    slug: "talent-connect",
    title: "Talent Connect",
    kind: "brand",
    brief: "Logo, brand identity and visual identity.",
    status: "independent",
    cover: "/studio/talent-connect-logo-brand-identity-visua.png",
    behance: "https://www.behance.net/gallery/220441161/Talent-Connect-Logo-Brand-Identity-Visual-Identity",
  },
  {
    slug: "tedx-srmist",
    title: "TEDxSRMIST",
    kind: "product",
    brief: "Web and app design for the TEDx event at SRMIST.",
    status: "independent",
    cover: "/studio/tedx-srmist-web-design-app-design.png",
    behance: "https://www.behance.net/gallery/221618397/TedX-Srmist-Web-Design-App-Design",
  },
  {
    slug: "web3-nft-marketplace",
    title: "Web3 NFT marketplace",
    kind: "product",
    brief: "Multi-page marketplace UI, designed in Figma.",
    status: "independent",
    cover: "/studio/web3-nft-marketplace-ui-multi-page-figma.png",
    behance: "https://www.behance.net/gallery/224289101/Web3-NFT-Marketplace-UI-Multi-Page-Figma-Design",
  },
  {
    slug: "health-dashboard",
    title: "Health dashboard",
    kind: "product",
    brief: "Dark-theme health dashboard UI.",
    status: "independent",
    cover: "/studio/dark-health-dashboard-ui.png",
    behance: "https://www.behance.net/gallery/246328755/Dark-Health-Dashboard-UI",
  },
  {
    slug: "ar-vr-map",
    title: "AR/VR map",
    kind: "web",
    brief: "Web design for an AR/VR map product.",
    status: "independent",
    cover: "/studio/ar-vr-web-design-map-ar-vr.png",
    behance: "https://www.behance.net/gallery/223216627/ARVR-Web-Design-Map-ARVR",
  },
  {
    slug: "rois",
    title: "Rois",
    kind: "brand",
    brief: "Logo for a clothing brand.",
    status: "independent",
    cover: "/studio/rois-logo-clothing-brand.png",
    behance: "https://www.behance.net/gallery/218066519/Rois-Logo-Clothing-brand",
  },
];

/** Behance pieces that are linked from the page's foot but not projected. */
export const studioAlso = [
  { title: "Poster illustration", href: "https://www.behance.net/gallery/219730511/Poster-illustration" },
  { title: "A3 poster", href: "https://www.behance.net/gallery/217777301/A3-Poster" },
  { title: "Independence Day template", href: "https://www.behance.net/gallery/228917555/Independence-Day-Template" },
  { title: "Vivo mood board", href: "https://www.behance.net/gallery/223882033/Vivo-Mood-Board-UI-Inspiration-Design-Mood-Board" },
  { title: "Dumb Money", href: "https://www.behance.net/gallery/217772229/Dumb-Money" },
];

export const studioKindLabel: Record<StudioKind, string> = {
  brand: "Brand identity",
  product: "Product UI",
  web: "Website",
  deck: "Pitch deck",
  print: "Print & creatives",
};
