# Chocolathon — chocolate-storyteller landing experience

The landing page for the Chocolathon (`wsuaiclub.com/chocolathon`): a minimal white
page built around the REAL open Cocoa Dolce box photo. As you scroll, six chocolate
sprites (real dome shapes from the brand's photography) rise out of the box one by
one — each carries one beat of the story (what it is → when → how → prizes → who →
sponsors) — then tuck into a "crown" above the box for the finale CTA.

No video anywhere: one photo + six sprites + pure code choreography. That means no
AI glitches, no chocolate-count drift, ~150KB of visuals, crisp at any resolution,
and fully reversible scrubbing.

**Run it:** `bun install && bun run dev` → http://localhost:8080

## ⚠️ The contract — what's safe to edit where

```
src/content/    ← EDIT FREELY (Lovable prompts are safe here)
src/film/       ← DO NOT TOUCH (choreography engine + the beat map)
public/box.webp     ← the real product photo (base of everything)
public/sprites/     ← the six chocolate cutouts
public/sponsors/    ← partner logos
pipeline/       ← local tooling, never ships
```

**Safe to change with Lovable prompts:** all copy, the panels and when they
appear (`src/content/panels.config.tsx`), the persistent header
(`Masthead.tsx`), the register section (`RegisterSection.tsx`), the mobile
story (`MobileStory.tsx`), colors/fonts (`tailwind.config.ts`, `index.css`).

**Comes back to Claude Code:** anything about the scroll feel, frames, timing,
canvas, or preloading — that's all `src/film/ScrollFilm.tsx`, and one wrong edit
there breaks the whole experience.

### Editing a beat's text, or adding a button/form later

Panels live in `src/content/panels.config.tsx`, keyed by beat name
(`what`, `when`, `how`, `prizes`, `who`, `sponsors`) — edit the JSX freely.
Timing for both the chocolate AND its panel comes from one shared map,
`src/film/beats.ts`; retime a beat there and everything moves together.
Buttons and links inside panels are clickable automatically. **The
registration form goes in `RegisterSection.tsx`** — every CTA on the page
already points at `#register`.

## How the choreography works (60 seconds)

`ScrollFilm.tsx` renders a 760vh track with a sticky stage. The real box photo
sits fixed in the lower half (it shrinks politely under the hero title and the
finale CTA). Each sprite in the CAST table owns one beat: it rises from its
spot in the tray (positions measured off the photo), arcs to the side beside
its text panel, holds with a gentle scroll-tied bob, then tucks into its crown
slot above the box — where it stays for the rest of the scroll. All of it is a
pure function of scroll progress: scrub up and everything flies home. Sprites
use `mix-blend-multiply`, which melts their white backgrounds into the page —
that's why they have no visible edges.

## Fallbacks

- **Mobile (<768px)** and **prefers-reduced-motion**: no scroll-jacking — the
  same story as normal sections over three key frames (`MobileStory.tsx`).
- All copy lives in real DOM (panels stay mounted, visibility-toggled), so
  crawlers and screen readers see the full content.

## Deploying

Hosted on **Vercel**, under the club's own account (`wsuaiclub`), team **WSU AI Club**.
Lovable is no longer the host; it remains only the AI build platform that gives
participants credits.

`main` is connected to the Vercel project, so:

- **push to `main`** -> deploys to production at https://chocolathon.vercel.app
- **push any branch** -> gets its own preview URL

To deploy by hand without a push (needs `vercel login` as the club account):

```bash
vercel --prod
```

`.vercel/` holds the local project link and is gitignored.

**Commit identity:** this repo sets `user.name` / `user.email` locally to the club's
GitHub account. Vercel's Hobby plan refuses to build a private repo when the commit
author is not the Vercel account owner, so commits must come from the club identity
for auto-deploy to work. Do not "fix" this back to a personal identity without either
making the repo public or upgrading the Vercel plan.

**Domain:** `wsuaiclub.com/chocolathon` is a *path*, and DNS cannot point at a path.
It has to be either a route inside whatever serves the apex, a subdomain such as
`chocolathon.wsuaiclub.com`, or a rewrite from the main project. Not yet decided.

## Event facts the page states (source: planning docs)

Sat Sep 19, 2026 · 9 AM–5 PM · Woolsey Hall · teams 1–4, locked at registration
· every WSU major, no experience required · $500 / $250 + chocolate · free, food
provided · registration opens Aug 24, closes Sep 10. The lunch sponsor and
judges are deliberately not named. Track structure is decided after Aug 18 —
prize copy stays flexible until then.
