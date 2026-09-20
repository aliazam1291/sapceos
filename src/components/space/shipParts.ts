/*
 * The walkaround. Once the ship has landed, its parts introduce the
 * operator — each part is a point on the airframe (ShipModel local units,
 * nose −Z) and one fact from PROFILE.md. The metaphor does the talking:
 * sensors are discovery, the canopy is the person, canards are the PRD,
 * wings are the stack, engines are what shipped, fins are the loop.
 */
export type ShipPart = {
  id: string;
  /** Position on the airframe, ShipModel local units. */
  at: [number, number, number];
  /** The ShipModel part it rides on (EXPLODE key), so the marker follows the dismantle. */
  part: string;
  /** The loadout group this part lights up (profile `skills` group). */
  loadout: "Product" | "Design" | "Technical";
  /** Which side the label sits on, in screen space. */
  side: "left" | "right" | "up";
  system: string;
  title: string;
  line: string;
};

export const shipParts: ShipPart[] = [
  {
    id: "sensors",
    loadout: "Product",
    part: "fuselage",
    at: [0, 0.01, -0.72],
    side: "left",
    system: "Nose · sensors",
    title: "Discovery",
    line: "Finds the decision nobody has made yet. Vehicle status logic — moving, stopped, idle, delayed, offline — defined before anything was built.",
  },
  {
    id: "canopy",
    loadout: "Design",
    part: "canopy",
    at: [0, 0.1, -0.3],
    side: "right",
    system: "Canopy · operator",
    title: "Ali Azam Kazmi",
    line: "Associate Software Developer, Product & Platform at MapMyIndia [Gtropy], New Delhi. Founder of Smaak.ux on the side.",
  },
  {
    id: "canards",
    loadout: "Product",
    part: "canard",
    at: [-0.2, 0.02, -0.16],
    side: "left",
    system: "Canards · control",
    title: "The PRD",
    line: "Written before the build: problem statements, user stories, acceptance criteria, edge cases. The argument, made early enough to be wrong cheaply.",
  },
  {
    id: "wing",
    loadout: "Technical",
    part: "wing",
    at: [0.52, 0.0, 0.34],
    side: "up",
    system: "Wing · lift",
    title: "The stack",
    line: "Angular, React, Ionic, RxJS, D3, Mappls SDK — and a 30,000-route geospatial pipeline into S3. The tool the problem needs, not the one on the résumé.",
  },
  {
    id: "engines",
    loadout: "Technical",
    part: "engines",
    at: [0, 0.0, 0.56],
    side: "right",
    system: "Engines · thrust",
    title: "Shipped",
    line: "5+ live production projects. Vahan Shakti at 200,000+ users; Intouch and Indane Yatra Mitra on the Play Store.",
  },
  {
    id: "fins",
    loadout: "Design",
    part: "finL",
    at: [-0.1, 0.14, 0.3],
    side: "left",
    system: "Fins · stability",
    title: "The loop",
    line: "Ship, then look at what happened. A ~40% dashboard speed-up found after shipping — caching, RxJS state, API work.",
  },
];
