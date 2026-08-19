/* ═══════════════════════════════════════════════════════════════════
   TRACKS SECTION — the two ways to compete.

   Added 2026-08-18 after the Cocoa Dolce production tour. This is the
   most important thing a student needs to understand before they
   register, and the narrow scroll-film panels physically cannot carry
   two track descriptions.

   Prizes are deliberately UNEQUAL (changed 2026-08-18): Build pays
   $500/$250 and Pitch $300/$150. Building is the heavier lift, and Pitch
   was forecast to draw the larger field anyway, so the weighting is a
   recruiting lever toward Build. The page says why out loud rather than
   letting students infer that pitch work is valued less.

   The "get to know Cocoa Dolce" block that used to close this section was
   removed 2026-08-18: the what-it-is beat now carries their logo and a link,
   so it was a duplicate, and it read as filler.

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

type Track = {
  name: string;
  line: string;
  body: string;
  bullets: string[];
  prize: string;
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
    prize: "$500 first place · $250 second place",
  },
  {
    name: "Pitch Track",
    line: "Pitch something they should do.",
    body:
      "You answer the challenge by making the case for it: a recommendation " +
      "Cocoa Dolce could act on, backed by real evidence.",
    bullets: [
      "You submit a pitch video and a demo",
      "Judged on the argument and the evidence behind it",
      "Any skill level",
    ],
    prize: "$300 first place · $150 second place",
  },
];

export default function TracksSection() {
  return (
    <section id="tracks" className="border-t border-ink/10 bg-white px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Two ways to compete</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Pick your track.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/70">
            The challenges span the whole business, not just the technical
            corners of it. Whatever you study, there is a version of this you
            are already equipped for.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink/70">
            You do not pick a track when you register. Prompts release
            September 14, and once you have seen them you decide which way to
            answer. Each track is judged on its own, so you are only ever
            compared with teams doing the same kind of work. Build carries the
            larger prize because it is the heavier lift. Neither track requires
            AI, though every participant gets free Lovable credits.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-12 sm:grid-cols-2 sm:gap-10">
          {TRACKS.map((t) => (
            <div key={t.name} className="flex flex-col">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
                {t.name}
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink">
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
                {t.prize}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          $1,200 in prizes total · four winning teams
        </p>
      </div>
    </section>
  );
}
