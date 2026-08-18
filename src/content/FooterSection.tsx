/* ═══════════════════════════════════════════════════════════════════
   FOOTER — partners and sponsors, and the ways to stay in touch that
   are NOT Chocolathon registration.

   Kept separate from RegisterSection on purpose: the register CTA has
   to be the loudest thing on that section, so the "join the club" and
   "contact us" asks live down here where they cannot compete with it.

   No AI Club logo here (removed 2026-08-18). The current mark is a
   placeholder and sat badly next to the professionally designed Cocoa
   Dolce, Lovable and Jimmy John's logos; the club is named in text
   instead until a real mark exists.
   ═══════════════════════════════════════════════════════════════════ */

import {
  CLUB_EMAIL,
  CLUB_INSTAGRAM_URL,
  CLUB_JOIN_URL,
  CLUB_LINKEDIN_URL,
} from "./links";

/* Full-colour brand marks. The earlier monochrome versions looked
   cropped because the glyphs did not fill their viewBox; these use the
   official square-fill paths so the icon reads correctly at 24px. */
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          Hosted by the WSU AI Club · In partnership with
        </p>
        <div className="mt-6 flex items-center justify-center">
          <img
            src="/chocolathon/sponsors/cocoadolce.png"
            alt="Cocoa Dolce"
            className="h-5 w-auto"
          />
        </div>

        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          Sponsored by
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          <img src="/chocolathon/sponsors/lovable.png" alt="Lovable" className="h-6 w-auto" />
          <img
            src="/chocolathon/sponsors/jimmyjohns.webp"
            alt="Jimmy John's Sandwiches"
            className="h-12 w-auto"
          />
        </div>

        {/* Stay-with-the-club block. */}
        <div className="mt-16 border-t border-ink/10 pt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Not competing? Stay in the loop.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink/70">
            The AI Club runs workshops, speakers, and builds all year. Join the
            list and you will hear about the next one.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {CLUB_JOIN_URL ? (
              <a
                className="btn-cta"
                href={CLUB_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join the AI Club
              </a>
            ) : null}
            <a className="btn-ghost" href={`mailto:${CLUB_EMAIL}`}>
              Contact us
            </a>
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
      </div>
    </footer>
  );
}
