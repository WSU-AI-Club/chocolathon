/* ═══════════════════════════════════════════════════════════════════
   FOOTER — partners and sponsors, and the ways to stay in touch.

   One sponsor row (2026-09-06), in this order: Cocoa Dolce, Lovable,
   Jimmy John's, Red Bull, AI Prompt Championship, OCPD, DTMedia. Red
   Bull sponsors the drinks; the Barton School's Office of Career and
   Professional Development covers the room. The AI Prompt Championship
   (added 2026-09-14) is Ramsey Jamoul's national competition at Groover
   Labs, December 11-13; each track winner earns a slot to compete
   there. That is announced at the opening ceremony, not on the page.
   DTMedia (added 2026-09-15) is the student-run agency filming the day;
   its own block above the footer carries the story and the link.
   The row is larger than it used to be on purpose: with the register
   CTA gone from the page, this is the last thing a visitor sees and
   it can afford the room.

   Logo heights are set per mark, not shared: the wordmarks (Cocoa Dolce,
   Lovable, DTMedia) are wide and thin, the badges (Jimmy John's, OCPD) are tall,
   and Red Bull sits between. Equal heights would make the wordmarks
   read as banners and the badges as icons. The AI Prompt Championship
   mark is a crop of its social card (white type on a near-black
   ground), so it ships as a small dark tile with rounded corners rather
   than a cut-out wordmark, which would vanish on the white footer.

   The club's wide logo heads the footer as the host mark (2026-09-14,
   the real mark; the placeholder was pulled 2026-08-18 because it sat
   badly next to the partner logos). It sits above its own "Sponsored
   by" label so it reads as the host, not as a sixth sponsor.
   ═══════════════════════════════════════════════════════════════════ */

import {
  CLUB_INSTAGRAM_URL,
  CLUB_JOIN_URL,
  CLUB_LINKEDIN_URL,
  HQ_PATH,
} from "./links";

import { LinkedInIcon } from "./icons";

/* Full-colour Instagram mark; LinkedIn's lives in ./icons because the
   people page uses it too. */
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD521" />
          <stop offset="30%" stopColor="#F50000" />
          <stop offset="60%" stopColor="#B900B4" />
          <stop offset="100%" stopColor="#4300B9" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ig-grad)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.325 6.162 6.162 0 0 0 0-12.325zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      />
    </svg>
  );
}

export default function FooterSection() {
  const hasSocials = CLUB_LINKEDIN_URL || CLUB_INSTAGRAM_URL;

  return (
    <footer className="border-t border-ink/10 bg-white px-5 py-20 text-center">
      {/* Two sponsor rows since 2026-09-15 (Michael's call when the
          seventh mark made one line feel like a banner): the four that
          feed and equip the day on top, the three on the professional
          side under them. Three centred under four staggers on its own.
          Each row wraps independently on a phone. */}
      <div className="mx-auto max-w-6xl">
        <p className="label">Hosted by</p>
        <img
          src="/chocolathon/club/ai-club-wide.png"
          alt="WSU AI Club, Wichita State University"
          className="mx-auto mt-6 h-16 w-auto sm:h-20"
        />
        <p className="label mt-14">Sponsored by</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-8">
          <img
            src="/chocolathon/sponsors/cocoadolce.png"
            alt="Cocoa Dolce"
            className="h-7 w-auto"
          />
          <img src="/chocolathon/sponsors/lovable.png" alt="Lovable" className="h-9 w-auto" />
          <img
            src="/chocolathon/sponsors/jimmyjohns.webp"
            alt="Jimmy John's Sandwiches"
            className="h-20 w-auto"
          />
          <img src="/chocolathon/sponsors/redbull.svg" alt="Red Bull" className="h-14 w-auto" />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-8">
          <img
            src="/chocolathon/sponsors/aipromptchamp.png"
            alt="AI Prompt Championship"
            className="h-12 w-auto rounded-md"
          />
          <img
            src="/chocolathon/sponsors/ocpd.png"
            alt="Office of Career and Professional Development, Barton School of Business"
            className="h-16 w-auto"
          />
          <img src="/chocolathon/sponsors/dtmedia.png" alt="DTMedia" className="h-6 w-auto" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Stay-with-the-club block. */}
        <div className="mt-16 border-t border-ink/10 pt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Not competing? Stay in the loop.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink/70">
            The AI Club runs workshops, speakers, and builds all year. Join the
            list and you will hear about the next one.
          </p>

          {/* The mailto: contact button was removed 2026-08-18: it depends on
              the visitor having a default mail handler registered, which
              often is not the case on desktop, and it fails silently when
              they do not. LinkedIn and Instagram below are the working
              contact routes, and joining the list opens an email channel. */}
          <div className="mt-7 flex justify-center">
            {CLUB_JOIN_URL ? (
              <a
                className="btn-ghost !bg-white"
                href={CLUB_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join the AI Club
              </a>
            ) : null}
          </div>

          {hasSocials ? (
            <div className="mt-9 flex items-center justify-center gap-5">
              {CLUB_LINKEDIN_URL ? (
                <a
                  href={CLUB_LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WSU AI Club on LinkedIn"
                  className="transition-opacity hover:opacity-70"
                >
                  <LinkedInIcon />
                </a>
              ) : null}
              {CLUB_INSTAGRAM_URL ? (
                <a
                  href={CLUB_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WSU AI Club on Instagram"
                  className="transition-opacity hover:opacity-70"
                >
                  <InstagramIcon />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Competition HQ. Kept quiet down here so it never competes with
            the club ask above; the masthead and the HQ band carry the
            louder versions. */}
        <div className="mt-14 border-t border-ink/10 pt-8">
          <a href={HQ_PATH} className="label no-underline transition-colors hover:text-ink">
            Competition HQ: prompts, tracks, schedule, rules →
          </a>
        </div>
      </div>
    </footer>
  );
}
