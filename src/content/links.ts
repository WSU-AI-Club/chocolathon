/* ═══════════════════════════════════════════════════════════════════
   LINKS — every outbound URL and date-driven switch, in one place.

   Lovable: these three values are safe to edit. Nothing else on the
   page hardcodes a form URL, so changing them here changes every
   button at once.
   ═══════════════════════════════════════════════════════════════════ */

/* The REGISTRATION form — full team roster. Opens Monday, August 24
   and closes Thursday, September 10. Lives in the AI Club's Microsoft
   Teams account; responses land in the club's Excel sheet. */
export const REGISTER_URL = "https://forms.cloud.microsoft/r/aCrbnM5Dys";

/* The INTEREST form — email capture only, running August 6–23 per the
   Master Document. Leave empty if the page won't be public before
   August 24; the CTA then points at the registration form regardless. */
export const INTEREST_URL = "";

/* Flip to `true` on Monday, August 24, when registration opens. Swaps
   the CTA target, its label, and the line beneath it. The Microsoft
   Form also enforces its own open/close window in its own settings —
   set that too, so the two can never drift apart. */
export const REGISTRATION_OPEN = false;

/* Where every CTA actually points right now. Before August 24 this is
   the interest form, but only if one has been set above — otherwise
   the registration form, so a CTA can never dead-end on an empty href. */
export const ACTIVE_FORM_URL =
  !REGISTRATION_OPEN && INTEREST_URL ? INTEREST_URL : REGISTER_URL;

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
