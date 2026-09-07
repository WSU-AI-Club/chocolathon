/* ═══════════════════════════════════════════════════════════════════
   LINKS — every outbound URL and date-driven switch, in one place.

   Nothing else on the page hardcodes a URL, so changing a value here
   changes every button at once.
   ═══════════════════════════════════════════════════════════════════ */

/* The REGISTRATION form — full team roster. Lives in the AI Club's
   Microsoft 365 group; responses land in the club's Excel sheet. */
export const REGISTER_URL = "https://forms.cloud.microsoft/r/aCrbnM5Dys";

/* The Register buttons show until this instant and then disappear on
   their own. Nothing on the page prints this date, and no copy anywhere
   should. Explicit UTC offset so it reads the same in every timezone:
   Central Daylight Time is UTC-5 in September. The form enforces its own
   window in its own settings — keep the two in step by hand. */
export const REGISTRATION_HIDE_AT = new Date("2026-09-16T23:59:00-05:00");

export function registrationOpen(now: number = Date.now()): boolean {
  return now < REGISTRATION_HIDE_AT.getTime();
}

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

/* ── The prompts page ────────────────────────────────────────────────
   Public (decided 2026-09-06, no logins): the eight challenge prompts,
   the rules, submission, judging, and the run of finale day. Same
   origin, not an outbound link — the App-level route switch in
   `src/App.tsx` picks it up. /competitors still resolves to the same
   page for anyone holding the old link.

   The prompt text is served by /api/hub only after the release clock
   (midnight, September 14, Wichita time); before that the page shows a
   countdown and the prompts do not exist in the browser at all. */
export const PROMPTS_PATH = "/prompts";
