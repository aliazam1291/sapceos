
export type StarCategory = "all" | "missions" | "telematics" | "platform" | "navigation";

export interface GalaxyNode {
  id: string;
  title: string;
  category: StarCategory;
  position: [number, number, number];
  size: number;
  color: string;
  href?: string;
  org?: string;
  role?: string;
  premise?: string;
  stack?: string[];
  signals?: { label: string; value: string }[];
  isHub?: boolean;
  /** Real product icon, pulled from the app's own store listing. */
  icon?: string;
  /** Public listing for the shipped product. */
  storeUrl?: string;
  storeLabel?: string;
}

const RAW_NODES: GalaxyNode[] = [
  // Primary Core Navigation Hubs
  {
    id: "hub-missions",
    title: "Missions Hub",
    category: "navigation",
    position: [0, 0.4, 0],
    size: 0.35,
    color: "#22d0b2",
    href: "/missions",
    org: "SPACE OS",
    role: "Central Operations",
    premise: "Primary catalogue of software products, platform engineering, and field systems.",
    isHub: true,
  },
  {
    id: "hub-history",
    title: "Mission History",
    category: "navigation",
    position: [-3.2, 0.8, -1.8],
    size: 0.28,
    color: "#8fe4d3",
    href: "/mission-history",
    org: "SPACE OS",
    role: "Chronology & Proof",
    premise: "Chronological timeline of shipped products, team leadership, and architecture milestones.",
    isHub: true,
  },
  {
    id: "hub-lab",
    title: "Field Lab",
    category: "navigation",
    position: [-2.5, -0.6, 2.8],
    size: 0.26,
    color: "#8fe4d3",
    href: "/lab",
    org: "SPACE OS",
    role: "Experimental Systems",
    premise: "Interactive prototypes, 3D graphics shaders, and telemetry research.",
    isHub: true,
  },
  {
    id: "hub-notes",
    title: "Field Notes",
    category: "navigation",
    position: [3.4, 0.7, 1.9],
    size: 0.25,
    color: "#8fe4d3",
    href: "/field-notes",
    org: "SPACE OS",
    role: "Written Telemetry",
    premise: "Engineering logs, UX principles, and product ownership reflections.",
    isHub: true,
  },
  {
    id: "hub-contact",
    title: "Open Channel",
    category: "navigation",
    position: [2.8, -0.9, -2.6],
    size: 0.28,
    color: "#8fe4d3",
    href: "/contact",
    org: "SPACE OS",
    role: "Direct Transmission",
    premise: "Open a direct line for product opportunities, architecture queries, or collaboration.",
    isHub: true,
  },

  // Telematics & Geospatial Missions
  {
    id: "vahan-shakti",
    title: "Vahan Shakti",
    category: "telematics",
    position: [-1.8, 0.3, -3.2],
    size: 0.32,
    color: "#22d0b2",
    href: "/missions#vahan-shakti",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · Map UX",
    premise: "National-scale vehicle tracking for 200,000+ government operators with high-density marker clustering.",
    stack: ["React", "Mappls SDK", "TypeScript", "RxJS"],
    signals: [
      { label: "Users", value: "200,000+" },
      { label: "Distribution", value: "Play Store" }
    ],
    // Icon and link taken from the live listing referenced in the resume.
    icon: "/icons/vahan-shakti.png",
    storeUrl: "https://play.google.com/store/apps/details?id=com.ce.vahanshakti",
    storeLabel: "Play Store",
  },
  {
    id: "iocl-geortd",
    title: "IOCL GeoRTD Pipeline",
    category: "telematics",
    position: [1.6, -0.4, 3.1],
    size: 0.29,
    color: "#22d0b2",
    href: "/missions#iocl-geortd",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · Geospatial Pipeline",
    premise: "Injected 30,000+ geospatial routes at scale into Amazon S3 for Indian Oil distribution.",
    stack: ["Geospatial", "Amazon S3", "TypeScript"],
    signals: [{ label: "Routes Injected", value: "30,000+" }],
  },
  {
    id: "locate",
    title: "Locate — OEM Backend",
    category: "telematics",
    position: [-3.8, -0.5, 0.4],
    size: 0.27,
    color: "#22d0b2",
    href: "/missions#locate",
    org: "MapMyIndia [Gtropy]",
    role: "Independent Frontend Lead",
    premise: "Real-time vehicle telemetry web & mobile dashboard monitoring 20,000+ active vehicles in Maharashtra.",
    stack: ["React", "TypeScript", "Mappls SDK"],
    signals: [{ label: "Vehicles Monitored", value: "20,000+" }],
  },
  {
    id: "intouch",
    title: "Intouch Fleet System",
    category: "telematics",
    position: [2.2, 0.9, -3.5],
    size: 0.26,
    color: "#22d0b2",
    href: "/missions#intouch",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · Performance",
    premise: "Cross-platform logistics management for 10,000+ vehicles with architectural headroom for 50,000.",
    stack: ["React", "Ionic", "RxJS"],
    signals: [{ label: "Active Fleet", value: "10,000+" }],
    icon: "/icons/intouch.png",
    storeUrl: "https://play.google.com/store/apps/details?id=intouch.mappls.app",
    storeLabel: "Play Store",
  },
  {
    id: "indane-yatra-mitra",
    title: "Indane Yatra Mitra",
    category: "telematics",
    position: [-2.1, 1.2, 2.4],
    size: 0.24,
    color: "#22d0b2",
    href: "/missions#indane-yatra-mitra",
    org: "MapMyIndia · IOCL",
    role: "Frontend · Safety UX",
    premise: "LPG tanker tracking with route playback, geofencing, and automated safety alarms.",
    stack: ["React", "Ionic", "Mappls SDK"],
    signals: [{ label: "Sector", value: "Energy & LPG" }],
    icon: "/icons/iocl-cvtms.png",
    storeUrl: "https://play.google.com/store/apps/details?id=iocl.cvtms.mappls",
    storeLabel: "Play Store",
  },

  // Platform & Operations Systems
  {
    id: "technician-app",
    title: "Technician Field App",
    category: "platform",
    position: [3.1, -0.6, -1.2],
    size: 0.3,
    color: "#22d0b2",
    href: "/missions#technician-app",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · UI/UX · PRD",
    premise: "Field ops app designed for single-hand daylight use, handling installation, replacement, and rectification.",
    stack: ["Angular", "Ionic", "TypeScript"],
    signals: [{ label: "Stage", value: "Active Building" }],
  },
  {
    id: "mappls-shop-admin",
    title: "Mappls Shop & Billing",
    category: "platform",
    position: [-1.2, -1.1, -2.8],
    size: 0.28,
    color: "#4fb8a6",
    href: "/missions#mappls-shop-admin",
    org: "MapMyIndia [Gtropy]",
    role: "UI/UX Owner · PRD Author",
    premise: "Replaced fully manual billing operations with automated reconciliation and admin workflows.",
    stack: ["React", "TypeScript", "REST APIs"],
    signals: [{ label: "Replaces", value: "Manual Billing" }],
  },
  {
    id: "control-tower",
    title: "Control Tower",
    category: "platform",
    position: [1.2, 1.3, 2.1],
    size: 0.25,
    color: "#4fb8a6",
    href: "/missions#control-tower",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · Dashboard Arch",
    premise: "Real-time alert management turning streams of vehicle telemetry events into prioritized human action queues.",
    stack: ["React", "TypeScript", "RxJS"],
    signals: [{ label: "Domain", value: "Alerts & Ticketing" }],
  },
  {
    id: "fastag-platform",
    title: "FASTag Platform",
    category: "platform",
    position: [-3.5, 0.2, -3.0],
    size: 0.23,
    color: "#4fb8a6",
    href: "/missions#fastag-platform",
    org: "MapMyIndia [Gtropy]",
    role: "Full Stack Implementation",
    premise: "Multi-vehicle FASTag registration flow with OTP authentication and fleet account management.",
    stack: ["React", "Node.js", "REST APIs"],
    signals: [{ label: "Scope", value: "Full Stack" }],
  },
  {
    id: "hermes",
    title: "Hermes Design System",
    category: "platform",
    position: [3.7, 0.4, 0.8],
    size: 0.24,
    color: "#4fb8a6",
    href: "/missions#hermes",
    org: "MapMyIndia [Gtropy]",
    role: "Frontend · Design System",
    premise: "Modular component architecture and accessible internal logistics tool suite.",
    stack: ["React", "TypeScript", "Design System"],
    signals: [{ label: "Audience", value: "Internal Ops" }],
  },
];

/**
 * Pull every node in toward the galactic centre.
 *
 * At full spread the outermost hubs sat on the faint rim of the disc, and
 * their HTML labels clipped the panel edge ("Field Notes" ran off the right).
 * Applied here rather than at render time so the focus camera — which reads
 * these same coordinates — flies to where the star actually is.
 */
const NODE_SPREAD = 0.85;

export const GALAXY_NODES: GalaxyNode[] = RAW_NODES.map((node) => ({
  ...node,
  position: [
    node.position[0] * NODE_SPREAD,
    node.position[1] * NODE_SPREAD,
    node.position[2] * NODE_SPREAD,
  ],
}));
