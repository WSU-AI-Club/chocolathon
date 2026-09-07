/* ═══════════════════════════════════════════════════════════════════
   RELEASE CLOCK — server only.

   The prompts page is public (the team-code gate, its cookie, and the
   login/logout functions were removed on 2026-09-06). The one thing
   that still decides what the server sends is this clock.

   ── ENV VARS ──────────────────────────────────────────────────────
   PROMPTS_RELEASE_AT   ISO datetime, default 2026-09-14T05:00:00Z
       (= midnight Sep 14, Wichita time). Before this, /api/hub sends
       the briefing but NOT the prompts.

   PROMPTS_UNLOCKED     "true" to ignore the clock. For your own
       preview before the 14th. Remember to remove it.
   ═══════════════════════════════════════════════════════════════════ */

export const DEFAULT_RELEASE = "2026-09-14T05:00:00.000Z"; // midnight CT, Sep 14

export function releaseAt(): Date {
  const raw = process.env.PROMPTS_RELEASE_AT?.trim();
  const parsed = raw ? new Date(raw) : new Date(DEFAULT_RELEASE);
  return Number.isNaN(parsed.getTime()) ? new Date(DEFAULT_RELEASE) : parsed;
}

export function promptsUnlocked(): boolean {
  if (process.env.PROMPTS_UNLOCKED?.trim().toLowerCase() === "true") return true;
  return Date.now() >= releaseAt().getTime();
}
