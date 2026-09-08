# Portfolio design direction — Live Orbit

> **This document supersedes "Quiet Orbit" (the previous direction) in full.**
> Quiet Orbit banned always-on WebGL, continuous motion, glows, and limited the
> accent to three instances per screen. Those rules are **withdrawn**. If you
> find guidance anywhere in this repo that contradicts this file, this file wins
> — and you should fix the other file rather than quietly following it.

## Intent

The site is an **instrument you fly, not a page you read**. A visitor should
arrive, realise within two seconds that the thing is alive and reacting to them,
and want to scroll to see what happens next. Scroll is the primary interaction —
it is the throttle, not a scrollbar.

The register is **cinematic and geometric**, not sci-fi kitsch. Think orbital
mechanics displays, launch telemetry, and vector navigation charts — precise
line work that happens to be beautiful. Not neon, not chrome, not a game menu.

The one thing a visitor should remember: *"the whole site was one continuous
place, and it moved when I moved."*

## Visual language

- **Geometry over blobs.** Bodies are faceted polyhedra rendered as their own
  edges — icosahedron hulls, lit vertices, tight fresnel rims. Never smooth
  shaded spheres, never soft glowing balls, never a lathe-turned ornament.
- **Real orbital structure.** Paths are inclined ellipses with genuinely
  different eccentricities, each with a body riding it and a bright arc trailing
  behind. Concentric flat rings are what makes orbit diagrams look like clip art.
- **Continuous space.** One persistent star layer for the entire site, mounted
  once in the root layout. The sky must never reset between routes — that
  continuity is what makes the site feel like a place instead of a slide deck.
- **Depth is earned by parallax and occlusion**, not by drop shadows.
- **Panels, not cards.** Square corners, one hairline border, translucent fill
  so the starfield reads through, corner registration ticks. Rounded, opaque,
  shadowed cards are what make a dark site look like generic SaaS.
- **Editorial type still carries the argument.** The 3D is the stage; the words
  are the performance. Large declarative headlines, quiet mono metadata.

## Colour

Accent is `#22D0B2`. **The old "maximum 3 instances per screen" rule is gone.**

The replacement rule is about hierarchy, not headcount: on any screen there is
**one primary accent event** — the thing the eye should land on first — and
everything else in accent is subordinate to it, dimmer or smaller. Accent may be
used for glows, orbital paths, rim light, headline emphasis and large buttons.

What is still banned, because it is a legibility problem rather than a taste
one: accent as body-copy colour, and accent-on-accent (accent text on an accent
fill). Contrast against `#050505` must stay above 4.5:1 for anything readable.

## Motion contract

Continuous render loops are **allowed and expected**. They come with conditions,
because "alive" must not mean "hot laptop":

- **Never animate off a scroll event.** Store scroll in a shared signal; read it
  inside the frame loop and damp toward it. Undamped scroll-driven motion is the
  single fastest way to make this look cheap.
- Damping must be frame-rate independent: `1 - exp(-lambda * dt)`.
- Clamp `delta` per frame, so a backgrounded tab does not resume with a jump.
- Pause every loop when the tab is hidden, and when its canvas is off-screen.
- No per-frame allocation. Reuse scratch vectors; cache the objects you animate.
- Clamp `dpr` (≤1.75 desktop, ≤1.25 coarse pointer). Mobile is a different
  budget, not a smaller desktop: fewer bodies, no pointer drift, simpler shaders.

## Performance budget

Ambition is fine; unmeasured ambition is not. Verify with a real browser, not by
assertion — `tools/shot.mjs` and `tools/verify.mjs` exist for this.

- **Three.js must never be in the first-paint bundle.** Dynamic-import every
  scene, gated behind idle and/or intersection.
- Text is the LCP element on every page. Always.
- At most **two live WebGL contexts** at any scroll position. If a page needs a
  third, something is duplicated — merge it.
- Procedural geometry only. No glTF, no textures, no image sprites in 3D. A
  billboarded PNG in a starfield reads as a tile pasted on the screen.
- Production JS after all 3D has mounted: keep under **~500 KB** transferred.

## Accessibility

Non-negotiable, and unchanged from the previous direction:

- `prefers-reduced-motion` gets a genuinely different build: no pinning, no
  scroll hijack, no WebGL, no continuous loops — a static, readable page. Not a
  slowed-down version of the animated one.
- Every canvas carries a real text alternative describing what is shown.
- The site must be fully usable and legible before any 3D loads, and if WebGL is
  unavailable. Progressive enhancement, always — server-render the meaning.

## Home composition

1. **Hero** — declarative statement over the live field. Text renders first.
   The headline is set to the VIEWPORT, not to a column beside the galaxy.
2. **Evidence strip** — verified outcomes as an instrument readout.
3. **Missions** — the proof, as a hairline instrument grid. The five featured.
4. **Fragments** — everything that exists, as one draggable strip.
5. **More of the work** — the non-featured missions, so the home page never
   shows the same case study twice.
6. **Open channel** — a direct invitation.

### The pinned sequence is gone, and should stay gone

This list used to have a "Pinned sequence — a scrubbed screen the reader flies
through, four stages, camera keyframed per beat" at position 3. It was built
twice: first as an abstract flight through invented telemetry, then as an
interactive 3D card gallery with a solved helix layout and hover/click.

Both were reverted after being used rather than tested. A 400vh
ScrollTrigger pin made ordinary wheel scrolling feel stuck, content jumped
while the pin measured itself, and the mechanism ended up competing with the
work it existed to show. The second attempt was mechanically correct —
composition solved against clipping at four aspect ratios, textures cached,
draw calls *lower* than what it replaced — and still wrong, because none of
that addressed the thing that was actually bad about it.

The lesson is not "no 3D." It is that **taking the scroll away from the
reader is the expensive part**, and no amount of polish inside a pin pays
that back. The site's sense of motion comes from the persistent field, which
costs the reader nothing. If a pinned section is ever proposed again, the
burden is to show it beats plain scrolling *in use*, not in a harness.

## Quality bar

Two tests, and a visual has to pass both:

1. **Does it make the site more memorable, understandable, or navigable?**
2. **Does it still hold 60fps on a mid-range phone, and does it degrade to
   something honest when it can't run?**

"It only looks more futuristic" fails the first. "It's beautiful but it stutters"
fails the second, and stuttering is the one thing that reads as amateur no matter
how good the idea was.
