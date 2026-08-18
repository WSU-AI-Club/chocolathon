/* ═══════════════════════════════════════════════════════════════════
   TRACKS SECTION — the two ways to compete.

   Added 2026-08-18 after the Cocoa Dolce production tour. This is the
   most important thing a student needs to understand before they
   register, and the narrow scroll-film panels physically cannot carry
   two track descriptions.

   Both tracks carry IDENTICAL prizes on purpose: a team shipping a
   prototype is never scored against a team pitching a business case.

   Neither track's copy names a major or a background. Both are open to
   anyone, and saying otherwise would quietly sort students out of the
   one they might actually be better at.

   Teams do NOT choose a track at registration (decided 2026-08-18).
   Prompts release Sep 14, four days AFTER registration closes, so a
   choice made at signup could only be based on identity ("I'm a business
   major") rather than on the work. They choose when they submit.

   Neither track requires AI. Lovable credits are offered to everyone
   because Lovable sponsors the event, not because the tools are
   mandatory.
   ═══════════════════════════════════════════════════════════════════ */

import { COCOA_DOLCE_ABOUT_URL } from "./links";

type Track = {
  name: string;
  line: string;
  body: string;
  bullets: string[];
};

const TRACKS: Track[] = [
  {
    name: "Build Track",
    line: "Ship something that works.",
    body:
      "You answer the challenge by building it: a working product or " +
      "prototype that Cocoa Dolce could actually put to use.",
    bullets: [
      "You submit the product, a video, and a demo",
      "Judged on how useful and well built it is",
      "Any skill level",
    ],
  },
  {
    name: "Case Track",
    line: "Pitch something they should do.",
    body:
      "You answer the challenge by making the case for it: a recommendation " +
      "Cocoa Dolce could act on, backed by real evidence.",
    bullets: [
      "You submit a pitch video and a demo",
      "Judged on the argument and the evidence behind it",
      "Any skill level",
    ],
  },
];

export default function TracksSection() {
  return (
    <section id="tracks" className="border-t border-ink/10 bg-white px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Two ways to compete</p>
          <h2 className="font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
            Pick your track.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/70">
            You do not pick a track when you register. Prompts release
            September 14, and once you have seen them you decide which way to
            answer. Both run as separate competitions with the same prizes, so
            you are only ever judged against teams doing the same kind of work
            as you.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-12 sm:grid-cols-2 sm:gap-10">
          {TRACKS.map((t) => (
            <div key={t.name} className="flex flex-col">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
                {t.name}
              </p>
              <h3 className="mt-3 font-display text-2xl font-medium leading-tight text-ink">
                {t.line}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-ink/70">
                {t.body}
              </p>
              <ul className="mt-5 space-y-2 border-l-2 border-gold pl-5 text-sm leading-relaxed text-ink/60">
                {t.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mt-auto pt-5 font-ui text-sm font-semibold text-ink">
                $400 first place · $200 second place
              </p>
            </div>
          ))}
        </div>

        {/* Both tracks require understanding the business, so the invitation
            to go read about Cocoa Dolce belongs here rather than in the footer. */}
        <div className="mt-16 border-t border-ink/10 pt-12 text-center">
          <p className="mx-auto max-w-lg text-base leading-relaxed text-ink/70">
            Whichever track you pick, you are solving for a real company. Start
            by getting to know them.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink/55">
            Every participant gets free Lovable credits. Use them, or build
            with whatever you like. Neither track requires AI.
          </p>
          <div className="mt-6">
            <a
              className="btn-ghost"
              href={COCOA_DOLCE_ABOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              About Cocoa Dolce
            </a>
          </div>
        </div>

        <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          $1,200 in prizes total · four winning teams
        </p>
      </div>
    </section>
  );
}
