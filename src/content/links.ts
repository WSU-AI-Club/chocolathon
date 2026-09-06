/* ═══════════════════════════════════════════════════════════════════
   LINKS — every outbound URL, in one place.

   Nothing else on the page hardcodes a URL, so changing a value here
   changes every button at once.

   Registration is NOT on this page (decided 2026-09-06). It ran
   August 24 – September 10 as a Microsoft Form circulated separately
   (https://forms.cloud.microsoft/r/aCrbnM5Dys, owned in the club's
   MS 365 group). The page launches when the competition starts, after
   registration has closed, so it carries no register CTA and no
   registration dates. The registration switch and form URL that used to
   live here were removed with the buttons.
   ═══════════════════════════════════════════════════════════════════ */

/* ── AI Club (not Chocolathon-specific) ──────────────────────────────
   Any of the three URLs below may be left empty: the footer hides that
   button entirely rather than rendering a dead link. Fill them in and
   the button appears. */

/* The club's membership / email-list Microsoft Form (name + email, the
   one with the QR code). This is the "Join the Club" button. It is NOT
   the contact route — "Contact us" is a plain mailto: to CLUB_EMAIL. */
export const CLUB_JOIN_URL = "https://forms.cloud.microsoft/r/SJ8WYc9kxx";

export const CLUB_LINKEDIN_URL = "https://www.linkedin.com/company/wsu-ai-club/";
export const CLUB_INSTAGRAM_URL = "https://www.instagram.com/wsuaiclub/";

export const CLUB_EMAIL = "aiclub@wichita.edu";

/* Cocoa Dolce's own About page. Both tracks require understanding the
   business, so the page sends students there to read up first. */
export const COCOA_DOLCE_ABOUT_URL =
  "https://shop.cocoadolce.com/pages/about-us";

/* Lovable sponsors the event and gives every participant credits, so the
   who-can-enter beat links out to them. lovable.dev/about is a 404; the
   homepage is the canonical destination. */
export const LOVABLE_URL = "https://lovable.dev";

/* ── Competitor HQ ───────────────────────────────────────────────────
   The gated area for registered teams: prompts, rules, submission and
   judging. Same origin, not an outbound link — the App-level route
   switch in `src/App.tsx` picks it up. It is deliberately reachable
   only from the small footer line, never from the masthead: the
   masthead's single primary action is Register, and 95% of visitors
   before September 10 are not competitors yet.

   The content behind it is served by /api/hub and gated server-side,
   so linking to the path leaks nothing. */
export const COMPETITOR_PATH = "/competitors";
