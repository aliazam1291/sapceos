# SPACE OS — Ali Azam Kazmi

**Live: https://aliazamkazmi.vercel.app**

The personal site of Ali Azam Kazmi — product engineer, UX strategist and founder & CPO of [DumbMoney](https://www.dumbmoney.in/) — built as a flight through the work: a galaxy of missions, a ship that travels with you, holograms for projects and drones for case studies.

- [Missions](https://aliazamkazmi.vercel.app/missions) — fleet and telematics platforms for 200,000+ users, each with its own report
- [DumbMoney](https://aliazamkazmi.vercel.app/dumbmoney) — the venture
- [Field notes](https://aliazamkazmi.vercel.app/field-notes) — independent product case studies
- [Writing](https://aliazamkazmi.vercel.app/writing) · [Studio](https://aliazamkazmi.vercel.app/studio) · [Flight rules](https://aliazamkazmi.vercel.app/decisions) · [About](https://aliazamkazmi.vercel.app/about)
- [Résumé (PDF)](https://aliazamkazmi.vercel.app/Ali_Azam_Kazmi_.pdf) · [Open channel](https://aliazamkazmi.vercel.app/contact)

## Stack

Next.js 16 (App Router) · React 19 · three.js / React Three Fiber · SCSS modules · GSAP + Lenis · Web Audio · Vercel.

## Working on it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production checks build to a separate directory so the dev server is never touched:

```bash
BUILD_DIR=.next-prod npx next build
BUILD_DIR=.next-prod npx next start -p 3210
```

`CLAUDE.md` holds the design direction and every measured rule; `PROFILE.md` is the only source of biographical or project facts. The `tools/` directory is a set of Playwright harnesses (SEO, console, mobile, smoothness, shader compiles, Lighthouse) run against the production build before a release.
