/* ═══════════════════════════════════════════════════════════════════
   REGISTER SECTION — the landing spot for every CTA on the page.

   Registration itself is a Microsoft Form owned by the AI Club's Teams
   account; this section is the handoff to it. The URL and the Aug 24
   open/closed switch both live in `./links` — edit them there, not here.
   ═══════════════════════════════════════════════════════════════════ */

import { ACTIVE_FORM_URL, REGISTRATION_OPEN } from "./links";

export default function RegisterSection() {
  return (
    <section
      id="register"
      className="border-t border-ink/10 bg-white px-5 py-24 text-center"
    >
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-4">Registration</p>
        <h2 className="font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Build ahead. Bring your team.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/70">
          Open to all WSU students. Teams of one to four, locked at
          registration. You choose your track
          later, once the prompts are out. Registration runs August 24 to
          September 10, prompts release September 14, and the finale is
          September 19.
        </p>
        <div className="mt-9">
          <a
            className="btn-cta"
            href={ACTIVE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Register your team
          </a>
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/45">
          {REGISTRATION_OPEN
            ? "Registration closes Thursday, September 10"
            : "Registration opens Monday, August 24"}
        </p>
      </div>

      {/* Partners, sponsors and the club asks now live in FooterSection,
          so nothing down-page competes with the register CTA above. */}
    </section>
  );
}
