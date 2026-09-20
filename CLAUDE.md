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
  `PAGE_PLAN`'s waypoints are fixed **screen fractions**, so they land in
  the same relative spot on every device — on a short mobile viewport
  that put the rest position (p=0, p=1) at 80% down the first screen and
  the sweep waypoint (p=0.5) at vertical centre, both landing on live
  text on every secondary page (`/about`, `/contact`, `/mission-history`,
  `/decisions`, found 2026-09-18). A single mobile text column runs
  nearly edge to edge, so there is no interior spot free of copy — fixed
  with `PAGE_PLAN_COARSE`, selected below 768px width (`narrow` state,
  not `coarse`/touch — a narrow desktop window has the same problem): the
  ship stays parked top-right beside the heading all the way down the
  page, pushed past where the text wraps rather than over it. Check with
  `tools/ship-plan-uat.mjs` (rest position, every secondary page) and
  `tools/ship-midscroll-uat.mjs` (p≈0.5, the sweep waypoint) before
  touching either plan.
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
- *The launch sequence* (`BootScreen`): first visit of a session. The
  scene IS the screen (2026-09-17): `BootShip` full-bleed — the ship on
  the lit platform, front three-quarter, masts, fog, a vignette and corner
  brackets — with the HUD in the corners (mark top-left, "Pad 01 ·
  pre-flight / cleared for launch" top-right, the log bottom-left, the
  hold bottom-right). Never a framed canvas in the middle of a black
  screen. Boot log tied to real
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
  separate closing block. Later the same day: gear comes down through the
  descent (`ShipModel.setGear`), a dust ring fires on contact, fog and a
  ground grid make it a place; DISMANTLE (button, or click the ship) is an
  exploded view — `ShipModel.setExplode` slides every part along
  `EXPLODE`, markers ride their parts, every part wears a tag and the
  active one opens; the **loadout** (profile `skills`, the tools) sits
  under the stage and lights the group the speaking part stands for.
  `Landing` is reusable (`label`, `section`) and is also the airframe
  section on `/about`. Check with `tools/landing-uat.mjs`,
  `tools/parts-uat.mjs`, `tools/dismantle-uat.mjs`.
  The stage is an instrument (2026-09-16, late): bordered, corner
  brackets, caption bottom-left (label, one line, a phase readout — on
  approach / gear down / on the pad / dismantled), the part index top-right
  (the one corner the airframe never reaches), the HUD strip along the
  bottom (index, ticks, DISMANTLE), the loadout as three bordered columns
  beneath. The ship sits right of centre (`_look.x −0.3`) so the caption
  owns the left; engines shut down within a second of contact
  (`ShipModel` hides plumes below thrust 0.02).
- *The pad is a platform* (2026-09-16, late). `Pad` is a raised gunmetal
  deck (PBR, chamfered), a recessed emerald inset ring, a chase of sixteen
  rim beacons (every fourth amber), wireframe apron markings on top, three
  floodlight masts kept out of the camera's quadrant (`masts={false}` on
  the launch screen), on a matte ground that takes the shadow. The ship
  stands on its gear (`REST_Y = 0.14 × scale`); the boot ship raises its
  gear as it climbs.
- *The black hole is interactive and has the ship* (2026-09-16, late).
  `SingularityScene`: drag orbits the camera (`uOrbit`, persistent), a
  hold dives toward the horizon (`uDist` 46 → 22, released it throws you
  back); the copy carries the hint "Drag to orbit · Hold to dive". A
  second transparent Canvas over the marcher flies `ShipModel` round the
  mass on scroll progress through the section (`orbitAt`: near pass low in
  front of the disc, far pass high over the lensed far side, lit by an
  amber point at the hole; a dive pulls the orbit in). While the hole is
  on screen `shipState.captured` is raised and the companion hides — the
  hole has the ship. Check with `tools/hole-uat.mjs` (wait for the
  section's canvas first: dev compiles the chunk lazily).
- *Sections are continuous* (2026-09-17). Ali: "all these sections should
  look continuous". No hairline rules between scenes; a scene's canvas
  clears to the page ground (`#060606`) and its bottom is masked into the
  sky (`MissionFlight` `.field` mask, 68% → transparent) so the next
  section rises out of the same star field. When adding a scene: clear to
  the ground, mask the edge, no border.
- *Success data* (2026-09-17). `Mission.results` are measured numbers
  transcribed from PROFILE.md (Vahan Shakti 200,000+ users, Intouch
  10,000+ / 50,000 headroom, Locate 20,000+, GeoRTD 30,000+, Play Store
  listings); `Mission.measure` is what WILL be measured where nothing is
  yet (the three active missions, and the shipped ones with no public
  metric). The report page renders a Results strip after the manifest:
  big numbers when measured, a checklist with empty ticks when pending.
  PROFILE.md line 49 stands: never estimate an outcome.
- *Every page's objects fly* (2026-09-16, late): the global `.flies`
  utility (globals.scss; `data-flight="left|right"` banks in from a side,
  `--lag` staggers) is on `/missions` rows, `/field-notes` rows and
  `/lab` projector cells; K-7 now works the `/missions` deck too
  (`data-bay` on `MissionRow`). New object rows: add `flies`, nothing
  else.
- *Objects move with the scroll* (2026-09-16). Hangar projectors rise in
  and lift away, drone-bay slots bank in and climb out — `animation-timeline:
  view()` on the `li`, reversible, staggered by column (`--lag`) — while the
  first-arrival timed sequences still run inside them. New object rows get
  the same pair (`*-in` on entry, `*-out` on exit); nothing sits still on
  the page while the ship flies past it.
- *Nose first* (2026-09-17). Ali: "the plane direction in the entire home
  page is not correct". `Companion` now aims its nose along its smoothed
  screen velocity (`setFromUnitVectors(−Z, aim)`), blended toward a
  resting three-quarter (`REST_AIM`) as it slows — down the page when the
  reader scrolls down, across when the plan crosses. `LandingScene` flies an
  approach (quadratic Bézier `P0→P1→P2`, nose along the path, a flare that
  grows toward touchdown, the last quarter turning onto the parking
  heading) instead of dropping like a lift. Any new ship driver: orient
  from velocity, never from a fixed yaw.
- *Lag, measured* (2026-09-17, Intel UHD, the desktop app's browser pane,
  `tools`-style rAF probes run in-page). Findings, so nobody re-derives
  them: (1) 129 CSS animations ran at once, on and off screen — every
  hologram flicker, every rotor; `.flies`/`.objectRow` now carry
  `content-visibility: auto` so off-screen objects do no work at all, and
  `html[data-perf="low"]` stops the decorative loops. (2) A single
  non-composited infinite animation (the nav's 7px status dot) repainted
  its fixed layer every frame and cost ~15fps — every infinite loop now has
  `will-change: transform, opacity` (status dots, robot, saucer, drone
  bob/sway, hologram plate/sweep/cone). (3) `DeepSpace` drawing 1500
  sprites per frame cost ~250ms/s of main thread; the faint field is baked
  into five depth-band layers re-baked in rotation, only bright stars draw
  live, and the whole canvas idles at 10–15fps when nothing moves. (4)
  The companion's lamp was a full-viewport gradient repainted per frame —
  now a 720px disc on the compositor; grain is one viewport not four; the
  companion has no shadow pass and runs 30fps while scrolling unless high;
  the Singularity's layout read moved into its frame loop. Star count,
  ray-march steps, landing dpr/shadows all scale with `perf.level`.
  Result on that machine, production build: scrolling 13 → 23–30fps.
  Still not smooth there; the next lever is the 2D star canvas → a WebGL
  points layer, and fewer full-screen fixed layers. Measure before and
  after with the in-page probe (idle rAF rate at a scroll position; a 3s
  programmatic scroll), not by eye, and note that `next dev` numbers are
  ~30% worse than `next build`.
- *Palette*: black ground (`#060606`), emerald signal (`#3CDD9E`) for UI,
  warm amber for engines/core/planets. One primary accent event per screen.
- *Performance is a feature.* `src/lib/perf.ts` decides a level; DoF only
  on high; no `backdrop-filter` over live canvases; no animated filters;
  no blend modes on full-viewport layers. Every new WebGL layer must gate on
  visibility (`useSceneFrameloop`) or run on demand.

- *One mission, six legs* (2026-09-18). Ali: "the flow can be much
  greater". The home page is now briefed in order — **00 Board** (boot +
  the opener: pitch, "targeting product roles", one measured number, "Skip
  the flight") → **01 Flight** (the HUD's number counts up on arrival,
  `ScanReadout`; beats are paced one system at a time on a 900ms dwell so
  a flick still flies past every world) → **02 Deck** (Hangar) → **03
  Debrief** (`Singularity`: the measured numbers orbit the hole as bodies —
  `offset-path: ellipse()`, wider and slower with weight, dim on the far
  side; the ship threads the ring) → **04 Rules** (`RulesLeg`: three
  beacons from `/decisions` in compact mode, the ship's hero pass in the
  empty right half) → **05 Notes** (drones already holding high and dim
  before arrival — never an empty sky — then descending one by one) →
  **06 Touchdown** (the landed ship says the operator's sentence,
  `Landing statement`). The operator statement section was cut. The rail
  (`SectionGuide`) is the route: current leg, "Leg N / 06", a dashed line,
  a diamond marker riding it — every section on every page needs an `id`
  plus `data-section` or the rail skips it. The galaxy HUD is a readout
  (no fill, 300px, no premise/cover); the Starship's nose is on the world
  while a beat holds and along the path on a transit, never at the lens
  (`MIN_FORWARD`). Check with `tools/legs-uat.mjs`, `tools/nose-uat.mjs`,
  `tools/additions-uat.mjs`; re-plot `HOME_PLAN` from
  `tools/sections-uat.mjs` when a leg moves.
- *A leg holds the frame* (2026-09-18). Ali: "when we are scrolling
  things are not coming and the user misses things." Measured with
  `tools/reader-uat.mjs` (a human-paced scroll, shot on arrival and 3s
  later): the three middle legs were each shorter than a viewport
  (Debrief 612px, Rules 948, Notes 792), so a reader crossed all three in
  ~3s while their arrival sequences were still running. Not more
  sections — more frame per leg: Debrief is 100vh, Rules and Notes
  `min-height` a viewport. Arrival is front-loaded: the first comms
  line at 120ms (gap 1.1s), drones 0.55s apart and 1.3s down, `.flies`
  objects fully in by 26% of the viewport (was 42%), note copy readable
  at 0.72 before the drone lands. Two bugs found the same way: (1)
  `--lag` must be a **percentage** — a bare number invalidates the
  whole `animation-range` and both fly-in and fly-out run across the
  element's entire time on screen (Rule 01 was mid-fly-out on arrival);
  (2) `contain-intrinsic-size: auto 420px` on `.flies` is a guess, and
  three compact beacons over-reserved ~840px so the page jumped up under
  the reader — every `.flies` row now sets its own content-box minimum
  (beacon 260/150, MissionRow 655, NoteFlight 380, projectorCell 680).
  `tools/shift-uat.mjs` measures it: a page may grow below the fold,
  it must never shrink. Re-plot `HOME_PLAN` when a leg's height changes.
- *The galaxy flight is a flight* (2026-09-18/19). Ali: "when it moves
  in the galaxy it can be better." The camera used to lerp in a straight
  line with exponential damping (a spike, then a creep) and the ship was
  glued to a fixed lens offset — a sticker on a sliding galaxy. Now:
  `Starship` has four phases — **boarding** (at station on the overview,
  nose on the core, there before anything moves), **flight** (a transit
  is an arc on a clock, `InteractiveGalaxy` `TRANSIT` 1.6s, smoothstep,
  a `sin²` bump that swings out and climbs over the dust, alternating
  sides; the ship *leads* — an underdamped spring on the camera's own
  velocity pulls it ahead and toward the destination, then it rejoins
  station with a settle), **leaving** (the last 3.5% of the pin raises
  `flightLeaving` → it climbs out top-right and forward, full burn, to
  where the companion enters), **off**. `cameraFocus.ship` (not `on`,
  which is the lens state) is what the companion yields to, so boarding
  is one ship. Nose cone is `MIN_FORWARD` 0.72 (≈44°): at a beat change
  the subject snaps to the next world before the camera turns, and a
  wider cone pointed the ship broadside at the lens. A `sin` bump
  (steepest at the ends) did the same via velocity — hence `sin²`.
  Film it with `tools/transit-uat.mjs`; SwiftShader's screenshot
  latency (seconds) makes sub-second choreography unverifiable there —
  use the desktop app's browser pane for timing.
- *Secondary-page plans, by kind* (2026-09-19). One `PAGE_PLAN` parked
  the ship on a report's manifest cell at rest and on its navigation
  rail mid-page. Every page header leaves the air above its title free
  (figure right, title ~48% down), so all kinds rest there (`REST`);
  the middle is per kind — `report` (sweep low-left under the sticky
  rail), `deck` (missions, lab, field-notes, **about**: small high pass),
  `prose` (hold the right). `pagePlanFor(pathname)`. Checked with
  `VW=1440 VH=900 node tools/ship-plan-uat.mjs` / `ship-midscroll-uat.mjs`.
- *No number below zero* (2026-09-19). A rAF timestamp can precede the
  `performance.now()` taken when an effect ran; `ScanReadout` counted
  "-7,026+" on the HUD. Both counters clamp `t` at 0.
- *The rail needs every section named* (2026-09-19). `/about` read
  "Leg 03 / 03" with five sections still to come; `/mission-history` had
  no rail at all. Every `Section` with a head now has `id` +
  `data-section`. The active missions' Outcome rows no longer render the
  editorial `DRAFT` flag ("⚠ Needs input") to visitors — they say "in
  progress; nothing measured yet, so nothing claimed" and list what will
  be measured. `ClientGrid` seams moved onto the cells (an unfilled row
  showed the container's seam colour as a lit blank panel).
- *The voice* (2026-09-18). Ali: "I want humor in my content." The
  humour is mission control's, and it lives in the instruments — never
  in a fact. `content/voice.ts` holds every line (rules at the top: dry,
  one beat, never about a number, never undermines the operator; the 404
  page set the register — "Checked under the couch cushions of the
  router"). `Comms` is the layout for it: a two-line mono transcript
  with callsigns (CAPCOM / SHIP / PAD) and T+ stamps, the same instrument
  as the boot log and the 404 log, typed on arrival (intersection +
  350ms confirm). Placed: home beat 0 (top-right sky, in the `aside`
  the HUD docks into, `translateY(-26vh)` — the low-right is the
  companion's boarding station and the outer worlds), the Debrief copy,
  under the Rules and Notes heads, the Touchdown caption once landed (a
  different line when dismantled), and under every secondary page's
  header (`ui.pageComms`). Also: the footer's one visible line, one boot
  log beat, K-7's idles, the "Skip the flight" tooltip, the Hangar
  title, the results note. Adding a joke: put the line in `voice.ts`,
  give it a callsign, keep it to one beat. Do not add a second kind of
  humour (mascot, emoji, exclamation). Check with `tools/voice-uat.mjs`.
- *A PM's site, not just a ship* (2026-09-17). `/decisions` ("Flight
  rules": `Beacons`, seven calls each with its PROFILE.md evidence),
  `Mission.ownership` (I decided / I built / With the team — only where
  PROFILE.md speaks to it), `Transmissions` (references; renders nothing
  until `profile.references` has real quotes), `lookingFor` on the
  channel and the nav dot, the résumé on the pad and at the end of every
  report and `/about`. Nothing here is inferred; add content only from
  PROFILE.md.
- *Scores, measured* (2026-09-19). Ali: "increase the website scores".
  Lighthouse 13 on the production build (`tools/lighthouse-uat.mjs`,
  desktop + mobile, every route) before: performance 59-91 desktop /
  32-52 mobile, accessibility 93-97, best-practices and SEO 100. What the
  audits pointed at, and the rule each left behind:
  (1) **three.js was in the layout bundle** — `Companion` was the one
  scene imported statically (layout.tsx), so the 230 KiB three chunk was
  on the critical path of every route. `CompanionLoader` dynamic-imports
  it after `requestIdleCallback` and after the boot screen has cleared.
  Every scene stays behind `next/dynamic`; check with the "Is Three.js
  reachable from the first-paint bundle?" item below before adding one.
  (2) **The page title was the LCP and waited for GSAP** — SplitText
  painted the server-rendered h1, hid it, and raised it 1-2 s later on a
  throttled phone (LCP 5 s mobile on every secondary page). `PageHeader`
  now rises the title in CSS from the first frame (`.pageTitleInner`,
  one masked block); `TextReveal` stays for section titles, which are
  scrolled to. Never put a JS-gated reveal on anything above the fold.
  (3) **`data-reveal` waited for hydration** — in browsers with
  `animation-timeline: view()` it is now a CSS scroll-driven fade
  (globals.scss, `entry 0% → 40%`), so content on screen at first paint
  is simply visible; `MotionProvider`'s IntersectionObserver remains the
  fallback. (4) **One token failed every contrast audit** —
  `--text-tertiary` was #5a5a5a (2.9:1); it is #7f7f7f (5.1:1 on the
  ground, 4.6:1 on a raised panel) and `--text-secondary` moved to
  #9a9a9a to keep the step. (5) **Typed logs shifted layout** — the boot
  log and every `Comms` transcript mounted lines one at a time; all
  lines are laid out from the start and revealed with `visibility`
  (`data-shown`), CLS 0.05-0.19 → ≤0.005. (6) `aria-label` is
  prohibited on a bare span (Impact dots: `role="img"`); `Beacons`
  takes `headingLevel` so /decisions has no h1→h3 skip. (7) Header
  figures (`Hologram`/`Drone` `priority`) load eagerly — the header's
  own cover was the LCP on the index pages and arrived 1.2 s late lazily.
  (8) `experimental.inlineCss` was tried for the four render-blocking
  stylesheets (320-620 ms mobile) and REJECTED: Next serialises the
  inlined CSS into the RSC flight payload too, /missions went 29 → 119
  KiB gzipped and mobile FCP 1.2 → 4.5 s. Leave the stylesheets as links.
  (9) **Software WebGL** — `perf.ts` `detectSoftwareGL()` (one
  throwaway context, `UNMASKED_RENDERER`) forces level `low` when the
  rasteriser is SwiftShader/llvmpipe, which is what PageSpeed's servers
  run: the galaxy then draws on demand at 20 fps, 6000 points, dpr ≤1,
  90 rocks. (10) **The galaxy is paused behind the boot screen** —
  `html[data-booting]` (set by `BootScreen`, cleared the instant the
  launch starts) switches its frameloop to demand after the first frame;
  it was rendering at full rate behind an opaque overlay for the whole
  launch sequence. Measure with the desktop app's browser pane on a
  blank page: the pane's own galaxy on the same iGPU turned one TBT
  reading from 2 s into 13 s. Local headless Chrome uses the real GPU
  (ANGLE D3D11), so the software path only shows on PSI.
- *The ship has mass* (2026-09-19). Ali: "spaceship motion needs to be
  better". `Companion` is a damped spring now (ω 3.1, ζ 0.78; stiffer on
  a departure), not a lerp — velocity is a state, so the ship has an
  **entrance** (from beyond the top edge on the station's own side,
  `enter("above")`, or from the top-right where `Starship` climbed out
  on the home hand-off), a **departure** (on `space:warp` it goes full
  burn ahead and up out of the frame, shrinking; the new route's
  entrance brings it back), a soft overshoot on every station change,
  thrust from acceleration (`acc`) not just speed, and a little
  z-push toward the lens with scroll speed. Every appearance is an
  entrance; it never fades up in place. Two guards: on the home page
  the companion presumes the flight live until the galaxy has drawn a
  frame (`cameraFocus.tick`, 8 s ceiling) — the lazy galaxy chunk used
  to arrive after the companion and there were two ships for ~2 s; and
  while `html[data-booting]` it hides (the pad has the ship).
  **Copy avoidance** (`copyAt`): every 120 ms the plan's station is
  hit-tested on a 5×3 grid of the hull (`elementFromPoint`, then the
  caret API's text node, confirmed against its glyph rects — the caret
  snaps to the nearest text in the hit element, a column away); if it is
  over words, the first clear offset from a ranked list wins (up; up and
  toward the open sky; further out; never past 0.42 of the width), a
  new pick needs two agreeing samples, and it eases back onto the plan
  when clear. The plans stay the route; this is what "never crosses
  copy" actually enforces. `window.__cameraFocus` / `__shipState` are
  exposed for the harnesses. Avoidance is OFF below 768px: a single
  full-width column has no clear interior, and the search pulled the
  ship off the right margin onto the manifest looking for one. Check
  with `tools/pageshot-uat.mjs` (a route at scroll positions),
  `tools/copyhit-uat.mjs` (what the hit-test sees, as a map) and
  `tools/boot-uat.mjs` (boot → hold → launch, with the galaxy/ship
  flags at each beat: expect one ship on home, the companion arriving on
  a secondary page); the desktop pane is too contended to screenshot
  mid-flight — use Playwright for stills.
- *Mission control* (2026-09-19). Ali: "more good UI components". Three
  instruments, all panels for text, none a card: **`CommandPalette`**
  (⌘K / Ctrl+K / "/" or the `⌘K` key in the dock; a dialog holding a
  combobox over a listbox — pages, the ten missions, the six notes, the
  bench, the résumé and the channel, ranked prefix → substring →
  subsequence, grouped only when unfiltered; selecting fires
  `space:warp` so the ship departs first; its two lines live in
  `voice.ts` `palette`). **`Pager`** (ui.tsx) under every report and
  note header: previous, "Bay 04 / 10" with a tick per entry, next, wrapping.
  **`Readout`** (ui.tsx) on /missions: hairline cells with counted
  numbers — bays, active, shipped, the largest measured deployment —
  every value from content. Adding to the palette: a new content type
  gets a `Kind`, a group label, and `keywords` for what the label does
  not say.

- *Nose first was backwards* (2026-09-19). Ali: "the motion of the
  spaceship in the galaxy is not correct." `Object3D.lookAt()` points an
  object's **+Z** at the target — only cameras and lights use −Z — and the
  ship's nose is −Z (ShipModel). `Starship` and `SingularityScene` used
  `lookAt`, so the lead ship flew tail-first into every world and the
  black-hole ship orbited backwards; the Companion (`setFromUnitVectors`)
  and Landing (quaternions) were right, which is why they looked right.
  Both now build the frame with `Matrix4.lookAt(eye, target, up)` +
  `setFromRotationMatrix`. Any new ship driver: never `g.lookAt()`.
  Verified with `tools/transit-uat.mjs` — read the frames for the
  nozzle rings (aft) and the needle (fore), not the silhouette; the fins
  read as a nose at thumbnail size and that is how this shipped. With the
  nose forward the hull reached over the opener's pitch, so `STATION` is
  up −0.1 (was −0.24). Also: `cameraFocus.ship` is snapped on the
  galaxy's first frame (the one-second ramp let the companion fly in and
  out during boarding), and the galaxy's 20 fps demand cap applies only
  to a software rasteriser (`perf.software`) — on a real GPU at a low
  level the hero scene keeps every vsync.
- *The studio* (2026-09-19). Ali, three times: "you didn't add my
  freelancing experience." Smaak.ux was a logo grid; `/studio` is a deck
  now — the eight PROFILE.md clients (deliverable exactly as PROFILE.md
  words it; a client without a Behance cover projects its MARK,
  `Hologram fit="contain"`) and six brand/product pieces from Behance
  (`public/studio/*.png`, downloaded from behance.net/aliak8 at Ali's
  instruction; posters and templates are linked in the foot, not
  projected). `content/studio.ts` is the source and every `brief` is a
  description of what was made — no outcome is written because none is
  on file. It is in the nav (plain: "Freelance work"), the palette
  (`studio` group), the sitemap, the deck flight plan, and `/about`'s
  Studio section hands off to it. The PM line: PROFILE.md still says
  "Product Engineer & UX Strategist, targeting product roles"; Ali has
  said the MapMyIndia PM move is coming — it goes on the site the moment
  it is in PROFILE.md, not before.
- *Sound* (2026-09-19). Ali: "we need sound too in the website."
  `lib/spaceSound.ts` is the whole instrument, synthesised in Web Audio
  (no files): an ambient pad + air, the ship's **engine** (sub oscillator
  + exhaust hiss following `shipState.thrust` — scrolling burns, a
  departure roars), and one-shots (tick, click, open/close, log, warp,
  launch, land, ping). **Opt-in, always** — the speaker in the dock
  (`SoundToggle`) or on the launch screen; preference in localStorage
  `space-os:sound`; a saved "on" arms on the first gesture
  (`SoundSystem`); reduced motion never auto-enables. Components dispatch
  `space:sfx {detail}` (or `sfx()`), never import the graph. The
  galaxy's HUD mute mirrors the same state and no longer silences the
  site on unmount. Levels are a room tone (master 0.16); do not add a
  soundtrack or a voice.
- *The launch screen is a countdown, not a gate* (2026-09-19). Ali: "a
  great loading screen." Progress is real — fonts, `space:stars`
  (DeepSpace's first draw), `space:pad` (BootShip's first frame),
  `space:ready` (galaxy; a 1.2 s floor off the home page) — shown as a
  percentage top-right that creeps but never lies. Once ready a launch
  window opens: **T−05 → T−00 and the ship launches itself**; the hold
  still launches sooner (and pauses the count), Skip still cuts through,
  reduced motion auto-launches at 2 s. A scan line sweeps the pad while
  it waits. Log lines blip, the hold spools a tone, launch is a whoosh —
  if sound is on. The typing timer never lowers `lines` (readiness can
  reveal them all first). Check with `tools/boot-uat.mjs` (auto-launch)
  and `HOLD=1 node tools/boot-uat.mjs`.

- *Ten legs, not six* (2026-09-20). Ali: "home page content is too less
  — sections." The 2026-09-18 cut left the front door with no person, no
  ledger, no résumé and no studio. Four legs came back, each a place with
  an object and every line PROFILE.md's: **02 Operator** (`OperatorLeg`:
  the portrait matrix, the core story in three lines, the operating loop
  as one numbered strip, a hairline fact list — role, desk, studio,
  looking for, base), **05 Impact** (the `Impact` ledger + ownership
  matrix, shared with `/about`), **07 Flight log** (`LogLeg`: the six
  roles on a dashed route with diamond waypoints, first point of each),
  **08 Studio** (`StudioLeg`: four Smaak.ux projectors, the door to
  `/studio`). Leg numbers are hard-coded in each component's
  `SectionHead` label (Hangar 03, Debrief 04, Rules 06, Notes 09,
  Touchdown 10) — renumber them when a leg moves. `HOME_PLAN` was
  re-plotted from `tools/sections-uat.mjs` (H 16472 at 1440×900):
  operator and log hold the copy left and give the ship the right; impact
  and studio are full-width panels/projectors and get the small high
  pass. Copy avoidance now sees the fixed chrome too (the rail's "Leg 07 /
  10" counted as sky and the ship sat on it). "Less page, more sky" still
  governs TYPE — nothing here scaled the type up; the page got longer, not
  louder.

- *The audit sweep* (2026-09-20). Ali: "do all audits and complete it."
  Five harnesses now cover what a release needs, all against the
  production server on :3210 (`BUILD_DIR=.next-prod`):
  `tools/seo-uat.mjs` (every sitemap route: status, title ≤65,
  description 70-165, one h1, canonical, og:image/title, valid JSON-LD,
  img alt, no DRAFT/undefined in copy, every internal link resolves),
  `tools/console-uat.mjs` (every route loaded and scrolled: page errors,
  console errors, failed requests — the only noise is three's
  `THREE.Clock` deprecation and a Next CSS preload for the deferred
  ship), `tools/mobile-uat.mjs` (375 and 320: sideways pan, elements past
  the edge, text under 11px, taps under 36px, top+mid shots),
  `tools/reserve-uat.mjs` (each `.flies` row's reserved vs rendered
  height — names the row behind a `shift-uat` finding) and
  `tools/lighthouse-uat.mjs`. What they found and the rules left behind:
  (1) every meta description ran 180-310 chars and three titles passed
  75 — `clipDescription()` in seo.ts clips at a word boundary, reports and
  notes use absolute titles (`Title — Ali Azam Kazmi`), every static
  description is under 158; (2) missions without a cover had no og:image —
  a route that sets its own `openGraph` does NOT inherit the root
  `opengraph-image`, so it is named explicitly as the fallback;
  (3) the global `.flies` reserve (420px) tied with a module's own on
  specificity and won on load order — /decisions reserved 420 per beacon
  against 233 rendered and pulled the page up 192px; the global rule is
  `:where(...)` now (zero specificity) so a module's reserve always
  wins; (4) at 320px the dock ran 59px past the edge — below 400px the
  Overview toggle is its glyph and the brand its mark; (5) mono labels
  hard-coded at 8-9px were unreadable on a phone — every such size is
  `max(0.5625rem, var(--micro-floor))`, and the floor is 11px under
  640px (`--type-micro` 12px there), 0 on a desktop; (6) without JS the
  five featured missions were unreachable on a desktop (the flight's
  fallback list is display:none above 768px) — `data-nojs` on the list
  and a rule in the layout's `<noscript>` show it; (7) the ship's lamp
  and the note rows' fly-in transforms measured wider than the viewport —
  the companion layer and the note list clip (`overflow: hidden/clip`),
  no reader could pan but the audit could. Run the five before a release;
  the SEO and console ones should read "clean" and "silent".

- *Shaders compile off the main thread* (2026-09-20). Profiling
  (`tools/profile-uat.mjs`, real Chrome via `CHROME=1`, and
  `tools/glblock-uat.mjs`, which times every blocking GL query and names
  the shader it waited on) found the last long tasks on every first
  visit: 1.1–2.9 s of synchronous shader compilation the moment a scene
  first drew. Four causes, four rules:
  (1) `renderer.debug.checkShaderErrors` is OFF in production
  (`lib/gl.ts` `quietGL`, on every `<Canvas onCreated>`) — with it on,
  `onFirstUse` reads the info logs, which waits for the compile;
  (2) every scene compiles through `WarmShaders` (`useWarmShaders.ts`):
  `renderer.compileAsync` (KHR_parallel_shader_compile, which ANGLE
  D3D11 has), and the Canvas holds `frameloop="never"` until it resolves
  — nothing may render before, and nothing may be `visible=false` during
  (`compile()` gathers lights with `traverseVisible`; a hidden root
  compiled light-less programs that the real render replaced, synchronously);
  (3) the ship's environment map (`shipEnv.ts`) is built once per
  renderer, before the materials compile, with PMREM's own materials
  pre-compiled on real planes with a render target bound — and it is
  built only at the **high** perf level: PMREM's GGX convolution program
  could not be warmed (its key differs from any pre-compile; ~550 ms per
  canvas on an iGPU, ×4 under the mobile audit) and a 375px hull does not
  show the reflection; (4) any new `<Canvas>` gets `onCreated={quietGL}`,
  a `WarmShaders` child and the `warm`-gated frameloop. Result on
  /field-notes mobile emulation, real Chrome: long tasks 749+1544+2960 ms
  → 53+213+63 ms, zero blocking GL queries. `window.__gls` lists every
  renderer for the harnesses (`tools/programs-uat.mjs`).

- *The recompile hunt* (2026-09-20, later). The home page still froze
  mid-scroll (long tasks 542/668/926/1105 ms) with every scene warmed.
  `tools/progkeys-uat.mjs` (every program a renderer compiles, with its
  #defines and light counts, and a Δ against the last of its family) and
  `tools/progdelete-uat.mjs` (createProgram/deleteProgram with call
  stacks) named three ways a warmed scene compiles again, all fixed:
  (1) **hiding a group that holds lights.** Three keys every lit program
  on the visible light set; `group.visible=false` on the ship (four
  lights) recompiled the whole canvas, and showing it recompiled it back —
  the Touchdown paid ~2 s twice, the Starship the same in the galaxy.
  Drivers call `ShipHandle.setShown()` (hides the airframe group only;
  the engine lamp lives outside it and goes to intensity 0). Never toggle
  `visible` on a light or its ancestor; never mount a light late.
  (2) **R3F's default shadow type.** `shadows` (boolean) sets
  PCFSoftShadowMap; three r185 swaps it for PCF on the first shadow pass,
  and that is in every key — the whole scene compiled again one frame
  after warm-up. Canvases with shadows pass `shadows="percentage"`.
  (3) **materials born without the map.** A canvas mounting after the
  bake got the env map a frame later, React replaced the four ship
  materials, the first set was disposed and the second compiled
  synchronously. `shipEnvIfReady` now hands a later renderer its
  `fromBaked()` copy synchronously, materials that want the map carry
  `userData.wantsEnv`, and `WarmShaders` waits (bounded) until none is
  without it. And the one that "could not be warmed": (4) **linked is not
  compiled on ANGLE.** PMREM's GGX program passed `compileAsync` and still
  blocked 1.8 s at first use (`getProgramParameter(ACTIVE_UNIFORMS)` —
  `glblock-uat` now names the query and the caller). Three keys on the
  geometry's attribute set (`HAS_NORMAL`: PMREM's planes have no normal,
  a PlaneGeometry does) and the D3D11 driver builds per-input/output-layout
  executables at DRAW time. `shipEnv.ts` warms on a plane with PMREM's
  exact attributes, DRAWS each material once into a HalfFloat linear
  target, and polls a `fenceSync` before the real pass. Result: zero
  blocking GL queries through boot and a full home scroll; the env map is
  back on every canvas at "high". Run `CHROME=1 BOOT=1 node
  tools/progkeys-uat.mjs /` after touching lights, shadows, materials or
  env maps: a family that appears twice on one renderer is a bug.
- *Style and layout, per frame* (2026-09-20, later). `tools/layout-uat.mjs`
  (a Chrome trace: forced Layout/UpdateLayoutTree by initiator,
  invalidation reasons by node, main-thread animations with Blink's
  reasons, long tasks) showed the scroll sampler was blamed for layout
  that CSS animations dirtied: a CSS `transform` animation on an SVG
  child (robot jets, drone rotors) is a layout per frame, on or off
  screen; `offset-path` (the Debrief masses), `top`, `transform-origin`
  and `var()` in keyframes run on the main thread. Rules: animate SVG
  children with opacity only; decorative loops on objects outside
  `.flies` pause off screen (`useOnScreen` → `data-off` →
  `animation-play-state: paused`; RobotGuide, Singularity); sweeps use
  translate, not top; the drop hint keeps a fixed origin.
  `contain-intrinsic-size` is the two-axis form `none auto Npx` — the
  one-value form reserved the WIDTH too and a 320px phone overflowed
  /field-notes by 104px (rows clipped their titles).
- *DumbMoney* (2026-09-20). Ali: founder & CPO, "I need a dedicated
  page." `/dumbmoney` is a venture page in the report's shape (hologram
  of the live site, manifest with the link and the co-founder, results
  strip honestly pending, ownership, rows, the two blog posts beside a
  phone capture). Facts in PROFILE.md "Venture"; the site's own public
  counters disagree with each other and are not results. In the nav after
  Studio, the palette, the sitemap, the flight log (`experience[0]`, org
  linked), the home opener and the /about lede. Founding date and the old
  résumé's numbers still wait on Ali.
- *More objects* (2026-09-20). Ali: "we need more elements like the
  spaceship" and "drones can be better looking." `Satellite`
  (`SatelliteModel`/`SatelliteScene`, PBR relay: foil bus, solar wings,
  gold dish, emerald beacon) is the /contact header figure —
  `PageHeader figureWidth` widens the slot. The drone SVG was redrawn
  (sculpted shell, motor cans, rotor rims, gimbal, LED seam, lit nav
  lamps) — same viewBox, same slots. A photoreal object per place is the
  pattern; one `View`-style shared canvas is the next step if drones go 3D.
- *The launch screen replays.* `?launch` on any URL forces it; the palette
  has "Replay the launch sequence." Ali reloaded the same tab and could
  not find it — the session flag is per tab.
- *Analytics.* `@vercel/analytics` + `@vercel/speed-insights` in the root
  layout (no-ops off Vercel, no cookies). `main` is the deployment branch
  (fast-forwarded from `redesign/interactive` 2026-09-20).

**Page map (each page is a place).**
Home = one mission in ten legs (2026-09-20, above): Board → Flight → Operator → Deck → Debrief → Impact → Rules → Log → Studio → Notes → Touchdown. Signals, Ticker and the operator statement stay off the home page; Impact and the loop live on both home and `/about`. `/missions` = the hangar deck. `/studio` = the studio deck (Smaak.ux, freelance). `/lab` = the bench. `/field-notes` = the drone bay. `/decisions` = the flight rules (beacons on a route). `/about` = the operator (portrait matrix, transmissions). `/mission-history` = the flight log (dashed route, diamond waypoints). `/contact` = the open channel (the relay satellite). `/dumbmoney` = the venture (Founder & CPO). Mission reports open on a large hologram of the interface; notes open on the drone that carried them.

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