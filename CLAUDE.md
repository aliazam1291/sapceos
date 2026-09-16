# CLAUDE.md — Portfolio Website (SPACE OS)

> **Visual direction: "The Journey" (set 2026-09-16) — this section is the
> authority; `DESIGN_DIRECTION.md` ("Live Orbit") is history.** Anything
> below that contradicts this block is older and loses.

## Theme direction — The Journey

**One sentence.** The site is a flight through Ali's work: you board at the
galaxy, a ship travels with you page to page, and everything you meet is a
*thing in space* — a world, a hologram, a drone, a robot — never a card.

**The world has four kinds of object, and each means one thing.**

| Object | Means | Where | Component |
|---|---|---|---|
| **World** (photoreal planet) | a destination — one of the five featured missions | the galaxy flight | `StarSystemNode`, `planetShader.ts` |
| **Hologram** (emitter → cone → projected plate) | a **project** — its interface, projected | `/missions` rows, `/lab`, home Hangar, every mission report's hero, `/missions` and `/lab` headers | `Hologram` |
| **Drone** (quadcopter with a slung load) | a **case study**, carried in | `/field-notes`, home Drone bay, every note's header | `Drone` |
| **Robot** (K-7) | the guide — reads what you hover, types it out | Hangar, Lab | `RobotGuide` |
| **Pad** (wireframe rings, shadow-catching floor) | ground — where the ship starts and ends | launch screen, Touchdown | `Pad` |

Plus two characters that are not objects: **the ship** (`ShipModel`, one
model — flies lead in the galaxy as `Starship`, travels with the reader as
`Companion`, lights the page beneath it) and **the visitor** (the saucer at
the open channel; the one joke; keep it the only one).

**Rules that follow.**
- *Projects are holograms. Case studies are drones.* Do not swap them and do
  not put a thumbnail or a card back where either belongs.
- *No card containers around objects.* A projector stands on a floor line; a
  drone hangs in the air; text sits beneath. Panels are for text-only
  content (rows, tables, forms).
- *Photoreal worlds and ships; wireframe instruments.* Planets and the ship
  get PBR, shadows, tone-mapping. Instruments (telemetry, loop, forms) stay
  wireframe emerald. Nothing in between.
- *Depth comes from the lens and from occluders*, never from tricks inside
  object shaders: `Cinematic.tsx` (bloom, DoF on the subject), rocks,
  nebula, shooting stars.
- *Motion is earned by the reader.* Sequences (drones landing one by one,
  the robot arriving and typing) trigger when the reader is actually there
  (`ArrivalGate`, confirmed 350ms later) and run on a clock, not the
  scrollbar — so a fast scroller still sees them.
- *The ship answers the reader.* Its station sweeps with scroll progress,
  it dips with scroll direction, banks into turns, rolls on a flick, lunges
  on navigation; the star field leans against it. Nothing else may claim
  "the ship" — it is one object.
- *The ship is the hero object* (2026-09-16). It flies a **flight plan** —
  waypoints by scroll progress in `Companion.tsx` (`HOME_PLAN`,
  `PAGE_PLAN`), plotted into the airspace each section leaves free — and
  the sections arrive around it. In the galaxy, `Starship` aims its nose
  at the beat's subject (`cameraFocus.target`) and sits large, low-left.
  Keep the plan when sections move: a waypoint over copy is a bug.
- *The ship flies calm* (2026-09-16, after the dzinr reference). The plan
  is a Catmull-Rom spline, damped hard (progress 1.6, position 2.4): no
  pitch flip on scroll reversal, no barrel roll, small bank/heading gains.
  It never crosses copy: full-width object sections (Hangar, Drone bay)
  get a small, high, distant pass; text sections hold the top-right beside
  the heading; the footer parks it in the empty air right of the columns,
  above the horizon. Check a route change with `tools/seq-uat.mjs` +
  `tools/sheet-uat.mjs` (a contact sheet of the ship mid-scroll).
- *The reference's one move* — dzinrstudio.com: giant calm type, heavy
  slow motion, and a showreel that starts as a framed card and opens to
  full bleed as you scroll. Ours is the black hole: `Singularity` arrives
  inset in the shell with rounded corners and opens to full bleed on
  `animation-timeline: view()` (clip-path, so free). One such moment per
  page; do not make every section expand.
- *The footer horizon is straight.* `HorizonScene` flattens the far rows
  (`horizon` smoothstep on z) so the terrain crests stay near and the far
  edge is one level line; the mask starts at 34%. A wandering crest at
  the far edge read as a misaligned graphic.
- *Less page, more sky* (2026-09-16). Ali: make the stars visible, cut
  the content like the reference, let the ship and the sections work
  together. Then, the same day: "text is occupying too much space" —
  the type scale was cut to caption size (`vars.scss` `--type-massive`
  caps at 3.4rem / 4.2rem wide; section titles use `--type-large`, ≤22ch;
  page titles `--type-massive`, ≤20ch; ledes ~1rem, ≤40ch). Text names
  the place from a corner; the object has the frame. Do not scale type
  back up for drama — add an object instead. `DeepSpace` runs 1500 stars
  at full level with a longer bright tail — the page is the sky, not a
  black wall with specks. The ship's lamp (`Companion` `.light`) is wide
  and warm so it visibly lights whatever it passes. The flight plan is
  measured against the sections (`tools/sections-uat.mjs` prints each
  section's scroll range) and the operator statement is the ship's hero
  beat: s 1.5, the sentence a caption in the lower left. `InteractiveGalaxy` drops the
  flight flag when its canvas leaves the screen, so the companion is never
  hidden in the hangar.
- *The launch sequence* (`BootScreen`): first visit of a session, the ship
  on the pad (`BootShip`, same `ShipModel`), boot log tied to real
  readiness (`space:ready` from the galaxy's first frame), HOLD TO LAUNCH
  fills on a wall clock and throttles the engines; at full the ship lifts
  off and `space:warp` fires. Harnesses set `sessionStorage
  space-os:booted` to skip it.
- *Touchdown* (2026-09-16, `Landing` + `LandingScene`): the home page ends
  with the ship landing on a pad — descent on a clock from arrival, flare,
  settle, real shadow — and then its parts introduce the operator
  (`shipParts.ts`: nose = discovery, canopy = the person, canards = the
  PRD, wing = the stack, engines = shipped, fins = the loop; every line a
  PROFILE.md fact). Markers are HTML projected from the airframe each
  frame; the walkaround cycles itself, hover/tap picks a part. While the
  section is in view `shipState.landed` is raised and `Companion` hides:
  one ship, now on the ground. The CTA lives on the pad; there is no
  separate closing block. Check with `tools/landing-uat.mjs` and
  `tools/parts-uat.mjs`.
- *Palette*: black ground (`#060606`), emerald signal (`#3CDD9E`) for UI,
  warm amber for engines/core/planets. One primary accent event per screen.
- *Performance is a feature.* `src/lib/perf.ts` decides a level; DoF only
  on high; no `backdrop-filter` over live canvases; no animated filters;
  no blend modes on full-viewport layers. Every new WebGL layer must gate on
  visibility (`useSceneFrameloop`) or run on demand.

**Page map (each page is a place).**
Home = the flight, cut to five places and a door (2026-09-16): galaxy → Hangar → black hole (results, the showreel move) → Drone bay → Touchdown (the ship lands, its parts introduce the operator, the door out is on the pad). Signals, Ticker, Impact and the Operating loop left the home page; Impact and the loop live on `/about`. `/missions` = the hangar deck. `/lab` = the bench. `/field-notes` = the drone bay. `/about` = the operator (portrait matrix). `/mission-history` = the flight log (dashed route, diamond waypoints). `/contact` = the open channel. Mission reports open on a large hologram of the interface; notes open on the drone that carried them.

Context for Claude Code working in this repo. Read this first, every session.

---

## What this project is

Personal site for **Ali Azam Kazmi**, built as **SPACE OS** — an interactive personal operating system with a **Quiet Orbit** design aesthetic, aimed at landing **Product Management / Product roles**.

- **North Star:** Mission Control for a curious builder.
- **One-Sentence Pitch:** "Give me a problem. I'll figure out what to do next."
- **Positioning:** This is NOT a generic developer/PM portfolio or a sci-fi game menu. It is an editorial workspace demonstrating product thinking, UX judgment, and execution.

---

## MCP & AI Skill Execution Protocol (STRICT WORKFLOW)

When implementing UI, components, or feature branches, follow this 4-step MCP execution loop:

1. **Context Discovery (Read First):**
   - Query `PROFILE.md` for factual data before writing copy. Never invent metrics — unverified values must stay as the `DRAFT` marker from `src/content/types.ts`.
   - Read `DESIGN_DIRECTION.md` before any visual work. It is the current visual authority and supersedes the older "Quiet Orbit" guidance wherever they disagree.
   - Inspect existing components in `src/components/` (and `src/components/space/` for anything 3D) before creating new ones. Re-use tokens and modular elements. There is no `src/once-ui/` in this repo — that path was in these instructions for a long time and sent sessions looking for a directory that has never existed.

2. **UI Architectural Planning (Plan Before Coding):**
   - For any UI build, define the DOM tree, layout grid structure, SCSS module approach, and state boundaries before writing code.
   - Strictly declare typography scale and grid spacing before generating component styling.

3. **Code Generation & Token Adherence:**
   - Write semantic HTML5 tags (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`).
   - Use CSS Grid / Flexbox with precise pixel/rem gap tokens instead of arbitrary wrapper margins.
   - Use SCSS modules with BEM or clean functional naming. Rely on the custom properties in `src/styles/tokens.scss` (imported via `@use "../styles/tokens.scss" as *`), not on hardcoded values.

4. **Self-Verification Checklist:**
   - Does this component look like generic SaaS? If YES -> square the corners, drop the shadow, make the fill translucent so the starfield reads through. Panels, not cards.
   - Is text immediately readable without client-side JS? If NO -> fix SSR/LCP rendering.
   - Is anything 3D a smooth shaded ball, a lathe form, or a billboarded image? If YES -> replace with faceted geometry (see DESIGN_DIRECTION.md, "Geometry over blobs").
   - Does any motion read scroll directly instead of damping toward it in a frame loop? If YES -> route it through `src/lib/scroll-signal.ts`.
   - Is Three.js reachable from the first-paint bundle? If YES -> dynamic-import it behind idle/intersection.

---

## UI/UX Engineering Rules (Preventing "Sloppy Design")

### Color Palette & Token Rules
> Palette is **black with emerald** (set 2026-09-12, matched to the
> footer horizon wireframe Ali picked out): a neutral black ground,
> **mint → emerald → deep green** as the ambient family, and **emerald** as the
> signal colour. Three palettes were tried and rejected the same week — the
> original mint-teal (`#22D0B2`, generic tech), red (alarm state), and a
> Carina gold/teal (looked good, Ali preferred the emerald). Do not drift.
>
> **Update 2026-09-14 — a warm second family is in.** Ali pointed at a
> planet-menu reference and said monochrome is not always nice: the galaxy
> now runs warm-to-cool (amber-white core, gold ring, emerald arms, cold blue
> outskirts) and the bodies are procedural planets — amber/ochre gas giants
> for hubs, blue-green rocky worlds for missions. Amber is for the *field*
> (planets, dust, the core); UI chrome, type and CTAs stay emerald.
>
> **Planets are photographic, not painted (2026-09-14, later the same day).**
> `src/components/space/planetShader.ts` owns a colour pipeline (ACES →
> sRGB → exponential fog) that planet, atmosphere and ring shaders all
> share; the renderer's tone mapping is bypassed by ShaderMaterial, so this
> is the only place bodies get their look. Rules that came out of the
> "does it even look real" pass: one sun (the galactic core), direction
> computed **per body** not per vertex; albedos are muted real-world values
> (beige/tan giants, dark oceans, olive/grey land) — saturation comes from
> the warm sun and cool bounce, never the paint; only `hub-missions` has a
> ring (`PlanetLook.ring`), because a ring on every giant is a toy. Do not
> hand a body a `#ff…` colour or add rings "for variety".
>
> **Scenes, not instruments (2026-09-14, evening).** Ali's read: the flow
> was five wireframe instruments and no *place*. Three scenes now carry
> the home page and each has a job — `Singularity` (ray-marched black hole
> above the results ledger: "every result has mass"), `Starship` (the
> operator's ship flying lead in the mission flight, lit by the core, PBR
> with a procedural room env-map and a panel-line shader injected via
> `onBeforeCompile`), and `Visitor` (a saucer that beams onto the
> open-channel CTA; the one joke on the site, keep it the only one).
> Worlds and ships are photoreal; the remaining instruments stay wireframe.
> Do not add a fourth "character" without cutting an instrument first.
>
> **Object vocabulary (2026-09-15).** Ali set it: *projects are holograms,
> case studies are drones.* `Hologram` (emitter disc → light cone →
> screen-blended plate of the cover, scanlines, chromatic ghosts, pointer
> tilt) is how a mission or lab entry's interface is shown on an index —
> `/missions` rows and the `/lab` gallery. `Drone` (shaded SVG quadcopter,
> blurred rotors, nav lights, spotlight, the cover slung beneath on cables)
> carries each field note on `/field-notes`. Field notes ARE the case
> studies (Flipkart discovery, Uber retention…); missions are the projects.
> Don't put a plain thumbnail back on either index, and don't swap the
> mapping.
>
> **Home flow (2026-09-15).** Flight (01, galaxy + HUD) → Signals readout →
> Ticker → Hangar (02, non-featured missions as holograms) → Singularity
> (results field) → Impact (03) → Operator (04) → Operating loop (05) →
> Field notes / Drone bay (06, three case studies) → Open channel (07, the
> Visitor). FleetDock, OrbitNav, Fragments and MissionSequence were deleted
> — they showed projects as blips and polygons, against the vocabulary.
> `GravityGrid` survives only on /contact.
>
> **Content and SEO (2026-09-15).** The six field notes are written (ported
> from the old site's MDX, rewritten in this voice). The originals carried
> survey percentages and "impact projections" with no source; those were
> cut on purpose and each note ends with "What I would measure" instead.
> Do not put unsourced numbers back. Mission reports are filled from the
> old write-ups + PROFILE.md; the three ACTIVE missions keep a DRAFT
> Outcome until Ali supplies measured results. `src/lib/seo.ts` owns all
> JSON-LD (Person, WebSite, ProfilePage, CreativeWork, Article,
> BreadcrumbList); `app/opengraph-image.tsx` generates the share card;
> mission and note pages use their cover as OG image. Body text supports a
> `## ` subhead prefix (ui.tsx `Body`).
>
> **The journey (2026-09-15, later).** Ali: holograms without card
> containers; the ship travels with you; a space cursor; robots.
> `ShipModel` is the one ship (clearcoat painted hull, framed canopy,
> nozzle rings, thrust-scaled exhaust); `Starship` flies it lead in the
> galaxy, `Companion` (layout-level, fixed, click-through canvas) flies it
> low-right on every route, nose dipping with scroll, engines burning with
> speed, lunging on `space:warp`, yielding while the galaxy flight is live
> (heartbeat: `cameraFocus.tick`). `CometCursor` is now a reticle — arcs
> free, corner brackets locked on interactive targets, tail, click ring —
> and hides the native cursor via `html.has-reticle`. `RobotGuide` (K-7)
> hovers beside projector rows (Hangar, Lab), turns toward and reads
> whatever `[data-bay]` you hover. Holograms stand on open floor (Hangar
> `.cell`, `ui.projectorCell`): no panels around projected things.
>
> **Depth is the lens and the occluders, not the shaders (2026-09-15).**
> Ali: "no meteors, no shadows, nothing". The answer was never more
> in-shader tricks. `Cinematic.tsx` is the lens — a postprocessing
> composer with Bloom (threshold 0.88, so only the core, plumes and ocean
> glint bloom), DepthOfField on `cameraFocus.dist` (subject sharp in
> flight, aperture closed on the map) and light chromatic aberration.
> `AsteroidField.tsx` is the occluder set — two instanced belts of lit,
> tumbling rocks plus three detailed passers that cross the frame in
> flight. `Nebula.tsx` is the far background (six faint procedural
> clouds). `ShootingStars.tsx` is the sky being alive. The core is one
> warm `pointLight` (inverse-square) and ambient stays at 0.22 so a rock
> has a dark side. Dust inside 2.6 units of the lens fades (`vNear`). Do
> not fake depth in object shaders again; adjust the composer.
>
> **One world (2026-09-15, night).** The ship and the star field are
> coupled through `shipState.ts`: Companion publishes screen position,
> velocity and thrust; DeepSpace pans against the ship's motion and draws
> warp streaks whose vanishing point is the ship while it burns. The
> companion flies a path with scroll progress (right → left → right),
> banks into it, dips with scroll direction, barrel-rolls on a hard flick.
> Drones in the Drone bay fly in one by one (staggered `animation-range`
> on `view()`), the title rides on the crate (`Drone` `label`/`sub`), no
> panels. `RobotGuide` flies in on arrival and types its line. Verify the
> galaxy with an ELEMENT screenshot of `canvas[data-engine]` — full-page
> shots under SwiftShader can land before the first composed frame and
> look black; two "fixes" were chased for that ghost before this note.
>
> **Performance budget (2026-09-15, late).** Ali: "too much lag". Rules
> that came out of it, do not undo them: `src/lib/perf.ts` decides a
> level (high/medium/low) from cores/memory/pointer and an fps probe fed
> by DeepSpace (`reportFrame`); it steps down once and remembers in
> localStorage `space-os:perf`. Cinematic: Bloom on medium+, DoF only on
> high at half res, no MSAA in the composer, gone on low. Galaxy dpr cap
> 1.35; Companion is `frameloop="demand"` at dpr 1 (30fps idle, 60 when
> scrolling, 20 behind a heavy scene); DeepSpace dpr ≤1.25, half-rate
> unless high; CometCursor clears a dirty rect, dpr 1. **No
> `backdrop-filter` anywhere that sits over a live canvas or scrolls**
> (flight HUD, nav dock, galaxy panels — all removed), no `filter: blur`
> or animated `drop-shadow`, no `mix-blend-mode` on full-viewport layers.
> The ship (`ShipModel`) is now a faceted blended-wing airframe in
> gunmetal — planform shapes extruded with bevels — not a white lathe.
>
> **Emerald is both signal and ambient, so hierarchy does the work.** The
> brightest emerald (`--accent`) marks the one primary accent event per screen
> (headline phrase, primary CTA, live status, the hub star). Everything
> ambient — glows, spotlights, panel edges, orbit strokes, hover washes,
> galaxy dust, starfield — uses the same hue at low alpha (`rgba(52,211,153,α)`)
> so it recedes. Every panel must have a visible edge at rest — the hairlines
> were raised for this ground on purpose; do not dim them back to 8%.

- **Primary Background:** `#060606` (Black. Shades of black only — a blue/indigo cast was tried on 2026-09-12 and rejected; surfaces must stay neutral.)
- **Secondary Surface:** `#0D0D0D` (Low-contrast card/panel fill); raised `#151515`
- **Hairline Borders:** `rgba(190,230,215,0.11)` (`--line`) / `0.22` (`--line-strong`). Panel edges use the emerald-lit gradient (`--panel-edge`). Gradient and accent-lit borders are allowed where they carry state (hover, active, focus); they must not be permanently animated on idle content.
- **Text Primary:** `#F2F5F8`
- **Text Muted:** `#8E9AA8`
- **Dimmed Text:** `#5B6674`
- **Ambient / Nebula:** mint `#8AF0C8` · emerald `#2FBF8A` · deep green `#0F3B2E`; a cool cyan `#5FCFC0` is reserved for the Lab kind, indigo `#9A8FD6` for Field notes.
- **Accent Signal:** `#3CDD9E` (Emerald; bright variant `#8AF0C8`) — governed by HIERARCHY, not headcount. One primary accent event per screen (the thing the eye lands on first); everything else in accent is subordinate — dimmer or smaller. Glows, orbital paths, rim light, headline emphasis and large buttons are all fair game. Still banned for legibility, not taste: accent as body-copy colour, and accent text on an accent fill. Keep readable text above 4.5:1 against `#07090F`.
  - *(The former "maximum 3 instances per screen" rule is withdrawn — see DESIGN_DIRECTION.md.)*

### Layout & Component Design
- **1px Grid Separators:** Instead of heavy cards with `border-radius: 16px` and shadows, build instrument panels using CSS Grid background separators:
  ```scss
  .gridContainer {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1px;
    background-color: #1a1a1a; // Generates razor-thin hairline grid borders
  }
  .gridCell {
    background-color: #0b0b0b;
    padding: 1.75rem 1.5rem;
  }