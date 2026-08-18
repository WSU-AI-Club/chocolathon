# Where this page lives

**Superseded 2026-08-18.** This file used to describe copying the page into the
Lovable-built `wsuaiclub/wsuaiclub` app. That app is being abandoned and rebuilt,
so those instructions are gone. The old version is in git history if it is ever
needed again.

## Today

This repo deploys on its own.

| | |
|---|---|
| Host | Vercel, team **WSU AI Club** (`wsu-ai-club`), project `chocolathon` |
| Live | https://chocolathon.vercel.app |
| Source | `github.com/wsuaiclub/chocolathon`, `main` connected for auto-deploy |

Push to `main` and Vercel builds and promotes to production. Any other branch
gets its own preview URL. To deploy by hand, `vercel --prod` (requires
`vercel login` as the club account).

## The open question: the real domain

`wsuaiclub.com/chocolathon` is a **path**, and DNS cannot point at a path. Only
three things actually work:

1. **One project owns the apex.** The rebuilt club site serves `wsuaiclub.com`
   and carries `/chocolathon` as a route. Cleanest end state, but it needs the
   new club site to exist, and this page would fold into that codebase.
2. **Subdomain.** `chocolathon.wsuaiclub.com` points at this project. DNS can do
   this today, and it needs nothing from the club site.
3. **Rewrite.** The apex project rewrites `/chocolathon/*` to this deployment.
   Gives the exact URL while keeping two repos, at the cost of some config.

Option 2 ships now and does not block option 1 later.

## If this ever does get folded into the club site

Two things bit us when the old app was surveyed, and they will apply to any React
app this page moves into:

- **Route placement.** The old router ended in a catch-all that redirected
  unauthenticated visitors to `/auth`. A public event page registered after that
  catch-all sends every student to a login wall. Register it in the public block.
- **Token collisions.** This page defines `display`, `ui`, `mono`, `ink`, `gold`.
  A host app that already defines any of those will either lose its own or break
  this one. Namespace them (`choco-ink`, `font-choco-display`) rather than
  merging.

## Editing

`src/film/` is the scroll-choreography engine and is sealed; changing it breaks
the whole experience. Everything else is in `src/content/`: copy, panels,
sections, and `links.ts`, which holds every outbound URL and the
`REGISTRATION_OPEN` switch.
