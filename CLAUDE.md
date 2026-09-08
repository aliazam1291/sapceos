# CLAUDE.md — Portfolio Website (SPACE OS)

> **Visual direction: "Live Orbit" — see `DESIGN_DIRECTION.md`.**
> The site is an interactive, cinematic instrument driven by scroll. Continuous
> WebGL render loops are expected, subject to the motion contract and
> performance budget in that file. Any older instruction in this repo calling
> for zero render loops, no glows, or an accent instance cap is withdrawn.

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
- **Primary Background:** `#050505` (Near-black warm graphite)
- **Secondary Surface:** `#0B0B0B` (Low-contrast card/panel fill)
- **Hairline Borders:** `1px solid #1A1A1A` or `#121212`. Gradient and accent-lit borders are allowed where they carry state (hover, active, focus); they must not be permanently animated on idle content.
- **Text Primary:** `#F5F5F5`
- **Text Muted:** `#8C8C8C`
- **Dimmed Text:** `#525252`
- **Accent Signal:** `#22D0B2` (Teal) — governed by HIERARCHY, not headcount. One primary accent event per screen (the thing the eye lands on first); everything else in accent is subordinate — dimmer or smaller. Glows, orbital paths, rim light, headline emphasis and large buttons are all fair game. Still banned for legibility, not taste: accent as body-copy colour, and accent text on an accent fill. Keep readable text above 4.5:1 against `#050505`.
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