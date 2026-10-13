/* The team's block on the landing page (2026-09-18). Sits after the
   DTMedia block and before the footer: the credits, where the page
   closes. One heading, one line, the eight portraits, and The Team
   button through to /team, where the same people have a page of their
   own that stays up after the event. */

import { TEAM_PATH, withBase } from "./links";
import TeamGrid from "./TeamGrid";

export default function TeamSection() {
  return (
    <section id="team" className="border-t border-ink/10 bg-white px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            The team.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            The AI Club leadership who put this day together.
          </p>
        </div>
        <TeamGrid className="mt-12 sm:mt-14" />
        <div className="mt-12 flex justify-center">
          <a className="btn-ghost !bg-white" href={withBase(TEAM_PATH)}>
            The Team
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
