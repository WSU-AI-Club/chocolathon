# Installing Chocolathon into the wsuaiclub.com project

Three steps. Everything the page needs is self-contained — scoped styles, its own
assets folder, one route component.

## 1 · Copy these into the club-site repo

| From this repo | To the club-site repo |
|---|---|
| `src/ChocolathonPage.tsx` | `src/pages/chocolathon/ChocolathonPage.tsx` |
| `src/chocolathon.css` | `src/pages/chocolathon/chocolathon.css` |
| `src/film/` (ScrollFilm.tsx, beats.ts) | `src/pages/chocolathon/film/` |
| `src/content/` (all 6 files) | `src/pages/chocolathon/content/` |
| `public/chocolathon/` (box, sprites, sponsors) | `public/chocolathon/` |

Note: after moving into `src/pages/chocolathon/`, the relative imports inside
ChocolathonPage.tsx (`./film/ScrollFilm`, `./content/...`, `./chocolathon.css`)
still resolve unchanged — the folder moves as one unit.

## 2 · Add the route

In the club site's router (where `/events`, `/workshops` etc. are declared):

```tsx
import ChocolathonPage from "@/pages/chocolathon/ChocolathonPage";

<Route path="/chocolathon" element={<ChocolathonPage />} />
```

If the site wraps routes in a global nav/footer layout, mount this route
OUTSIDE that layout — the page brings its own masthead and footer and is
designed as a full-bleed takeover.

## 3 · Merge six design tokens into `tailwind.config`

Add to `theme.extend` (these are additive — nothing existing changes):

```ts
colors: {
  ink: "#232A4D",
  gold: "#B8912D",
  amber: "#FAC905",
  paper: "#FFFFFF",
},
fontFamily: {
  display: ['"Bodoni Moda"', "Didot", "Georgia", "serif"],
  ui: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
  mono: ['"Space Mono"', "ui-monospace", "monospace"],
},
```

(Fonts load themselves via `@import` in chocolathon.css — no index.html edits.)

## Done — verify

- `/chocolathon` renders the white page: open box, title, amber CTA.
- Scroll: six chocolates rise one by one, each with its text; they collect in
  an arc above the box; finale CTA; register section below.
- The REST of the site looks exactly as before (styles are scoped under
  `.choco-root`; assets are namespaced under `/chocolathon/`).
- Mobile (<768px) shows the sectioned story instead of the scroll experience.

## Rules for future edits (put this in Lovable's Knowledge box)

> The /chocolathon page is a scroll-choreographed experience. Never modify
> `src/pages/chocolathon/film/` — that's the animation engine. All copy,
> buttons, and panels live in `src/pages/chocolathon/content/` and are
> safe to edit.
>
> Registration is NOT built in code — it's a Microsoft Form owned by the
> AI Club's Teams account. Its URL and the August 24 open/closed switch
> are the only two values in `content/links.ts`; change them there and
> every button follows. In-page CTAs scroll to `#register`; the button
> inside that section is the one that opens the form.
