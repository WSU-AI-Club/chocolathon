/* ═══════════════════════════════════════════════════════════════════
   LINKS — every outbound URL and date-driven switch, in one place.

   Nothing else on the page hardcodes a URL, so changing a value here
   changes every button at once.
   ═══════════════════════════════════════════════════════════════════ */

/* The REGISTRATION form — full team roster. Lives in the AI Club's
   Microsoft 365 group; responses land in the club's Excel sheet. */
export const REGISTER_URL = "https://forms.cloud.microsoft/r/aCrbnM5Dys";

/* The Register buttons show until this instant and then disappear on
   their own. Decided 2026-09-10: registration closes the minute before
   the prompts unlock, so nobody registers after seeing them, and the
   date IS printed now (REGISTRATION_CLOSE_LABEL) because the extension
   is announced. Explicit UTC offset so it reads the same in every
   timezone: Central Daylight Time is UTC-5 in September. The form
   enforces its own window in its own settings — keep the two in step
   by hand. */
export const REGISTRATION_HIDE_AT = new Date("2026-09-13T23:59:00-05:00");
export const REGISTRATION_CLOSE_LABEL =
  "Deadline extended — registration closes Sunday, September 13, 11:59 PM";

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

/* DTMedia (2026-09-15): the student-run media agency covering the event.
   The Covered-by block on the landing page links here; the footer mark
   does not, so the sponsor row stays one plain row of marks. */
export const DTMEDIA_URL = "https://dt-media.vercel.app/";

/* ── Competition HQ ──────────────────────────────────────────────────
   Public (decided 2026-09-06, no logins): the eight challenge prompts,
   the tracks, the finale-day schedule, the rules, and the
   FAQ, on one page. Same origin, not an outbound link — the App-level
   route switch in `src/App.tsx` picks it up. /prompts and /competitors
   resolve to the same page for anyone holding an older link.

   The prompt text is served by /api/hub only after the release clock;
   before that the page shows a countdown and the prompts do not exist
   in the browser at all. */
export const HQ_PATH = "/hq";
export const PROMPTS_HREF = `${HQ_PATH}#prompts`;

/* The judges-and-speakers page (2026-09-10). Public; its names come
   from /api/hub so HQ and this page never disagree. */
export const PEOPLE_PATH = "/people";

/* The client's copy of the server clock in api/_release.ts: 9:30 PM on
   September 13, Wichita time (moved up from midnight on 2026-09-13).
   Decides what the prompts BUTTON looks like; the server decides what
   the prompts PAGE contains. Keep the two identical. */
export const PROMPTS_RELEASE_AT = new Date("2026-09-14T02:30:00.000Z");

/* ── Submissions ─────────────────────────────────────────────────────
   The finale-day Microsoft Form. The submissions button is locked until
   1:00 PM on Saturday, September 19, Wichita time, then links here. The
   form enforces its own 1:00–2:00 window (moved from 2:15 on 2026-09-10) in its own settings. Leave the
   URL empty and the button stays locked with "Link coming" even after
   the instant — a missing URL can never ship a dead amber button. */
export const SUBMISSION_URL = "https://forms.cloud.microsoft/r/kWpfJhLss4";
export const SUBMISSIONS_OPEN_AT = new Date("2026-09-19T13:00:00-05:00");

/* ── Judging ─────────────────────────────────────────────────────────
   The judge page: the judge picks their name, works their queue, scores
   inside the card. Fed by /api/judging (published from the upload page)
   and gated by the judge token in the link (?k=, env JUDGE_KEY), so the
   path alone is not enough since 2026-09-15. The Microsoft scoring form
   (JUDGE_FORM_URL) was retired the same day. */
export const JUDGE_PATH = "/judge-c7m2x9";

/* The upload page: drop the form export, publish it to the judges. Also
   unlisted; the write itself is protected by UPLOAD_KEY on the server. */
export const UPLOAD_PATH = "/upload-k4n8pq";

/* The ranking page (2026-09-15): Michael's only, behind the upload key.
   Unlisted like the judge and upload pages. */
export const RESULTS_PATH = "/results-m3v8tq";
