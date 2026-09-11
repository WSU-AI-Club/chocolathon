# CLAUDE.md — chocolathon

The Chocolathon site. Vite + React + TypeScript on Vercel.
Repo: `github.com/wsuaiclub/chocolathon` (private, `main` auto-deploys).

## Vault contract — read this first

Founder-OS is the source of truth for this project. It is not in this repo.

    Vault root: C:\Users\goldm\OneDrive\Founder-OS

Use that live checkout, never a copy under `orca\workspaces\Founder-OS\`.
Per `orca-hub.md` the vault gets no worktrees — code repos do. This is one.

**This file is a bootstrap, not a source of truth.** It exists only because no
SessionStart hook fires outside the vault. Where it disagrees with the vault,
the vault wins: decisions log > context doc > vault CLAUDE.md > memory > wiki,
and this file sits below all of them.

### Session start — in this order, no skipping

0. Load `orca-orient`. The vault requires it before anything else is read.
1. Read these three, resolved against the vault root above:

       CLAUDE.md
       wiki/hot.md
       00-START-HERE/agent-memory/MEMORY.md

   `vault-start` states these as an already-read prerequisite and says not to
   re-read them. Inside the vault the hook loads them for you. Here, nothing
   does — so read them yourself at step 1, or vault-start runs on an assumption
   that is false.
2. Load `vault-start` and follow its routing. For this repo that reaches
   `chocolathon-work`, plus `vault-decisions` / `vault-memory` / `vault-ship`
   as the work calls for them.

All vault skills use vault-relative paths (`01-projects/...`, `wiki/...`).
Resolve every one of them against the vault root.

Authoritative for this project:

    01-projects/Chocolathon/chocolathon-decisions.md   append-only, newest at top
    01-projects/Chocolathon/chocolathon-context.md     living reference + NEXT SESSION

## End of session — do not skip

Update the NEXT SESSION section of `chocolathon-context.md` (done items dated,
queue reordered), and append to `chocolathon-decisions.md` when a decision was
actually made. Write a memory only for a trap, a correction, or a standing rule.

When appending a decision, match the format **practiced in the file**, not the
template at its top — the two have diverged.

**Leave `wiki/hot.md` to vault terminals.** It is one shared file across every
project; concurrent writers already caused a merge collision on 2026-09-11. The
per-project files above are safe to write from here. If hot.md is badly stale
and state has changed, say so rather than rewriting it from a repo session.

Never leave state only in the conversation — work done here is invisible to the
vault unless it is written there. The 18:00 "Founder-OS Vault Sync" task commits
and pushes the vault on its own (`git add -A`). **Never run git in the vault.**

## This repo

    src/          the live site — App.tsx, ChocolathonPage.tsx, and the
                  competitor/ content/ film/ judge/ people/ upload/ sections
    api/          Vercel functions — hub.ts, judging.ts, _content.ts, _release.ts
    pipeline/     offline scripts — make-codes.mjs, make-judging.mjs
    public/       static assets        dist/ build output

    bun run dev       vite
    bun run build     tsc -b && vite build   <- verify before claiming done
    bun run preview

**The registration page in the vault is not this site.**
`01-projects/Chocolathon/registration-page-prototype/` is a standalone
HTML/JS/CSS prototype, dead as a build target since the 2026-08-17 decision
(registration runs on a Microsoft Form). Visual reference only.

The unguessable routes (`/judge-c7m2x9`, `/upload-k4n8pq`, `/hq`, `/judging`)
are the soft gate. They carry `X-Robots-Tag: noindex` in `vercel.json` — keep
them out of links, sitemaps, and public copy.

## Git

Commit freely in this repo and show the diff; push only on Michael's yes; never
rewrite pushed history. `main` auto-deploys to Vercel, so a push is a deploy.
