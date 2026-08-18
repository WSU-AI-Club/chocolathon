/* ═══════════════════════════════════════════════════════════════════
   JUDGES SECTION — who decides, in two rounds.

   Naming: BOTH panels are public as of 2026-08-17 (Michael lifted the
   earlier internal-only rule on the preliminary judges; the Master
   Document was updated to match). A third industry judge may be added
   later — append to INDUSTRY_PANEL and the layout absorbs it.
   ═══════════════════════════════════════════════════════════════════ */

type Judge = {
  name: string;
  role: string;
  org?: string;
  note?: string;
  /* Seat confirmed but person not yet named. Rendered muted so an
     unfilled seat reads as "more coming", not as an oversight. */
  tbd?: boolean;
};

const INDUSTRY_PANEL: Judge[] = [
  {
    name: "Grant Johnson",
    role: "AI Software Engineering Leader",
    org: "INVISTA",
    note: "WSU alum",
  },
  {
    name: "Dane Laughlin",
    role: "Industries Lead",
    org: "Squint",
    note: "WSU alum",
  },
  { name: "To be announced", role: "Local AI industry leader", tbd: true },
  { name: "To be announced", role: "Local AI industry leader", tbd: true },
];

const FINALS_PANEL: Judge[] = [
  { name: "Ben Hesse", role: "Chief Operating Officer", org: "Cocoa Dolce" },
  { name: "To be announced", role: "Cocoa Dolce leadership", tbd: true },
  { name: "To be announced", role: "Cocoa Dolce leadership", tbd: true },
];

function JudgeList({ judges }: { judges: Judge[] }) {
  return (
    <ul className="mt-6 space-y-4 border-l-2 border-gold pl-5">
      {judges.map((j, i) => (
        <li key={`${j.name}-${i}`}>
          <p
            className={
              j.tbd
                ? "font-ui text-lg font-semibold leading-snug text-ink/35"
                : "font-ui text-lg font-semibold leading-snug text-ink"
            }
          >
            {j.name}
          </p>
          <p
            className={
              j.tbd
                ? "mt-0.5 text-sm leading-snug text-ink/35"
                : "mt-0.5 text-sm leading-snug text-ink/60"
            }
          >
            {j.org ? `${j.role}, ${j.org}` : j.role}
            {j.note ? <span className="text-ink/40"> · {j.note}</span> : null}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function JudgesSection() {
  return (
    <section id="judges" className="border-t border-ink/10 bg-white px-5 py-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Judging</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Who decides.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/70">
            Judging runs in two rounds, weighted toward how genuinely useful
            and well built your solution is for Cocoa Dolce.
          </p>
        </div>

        <div className="mt-14 grid gap-12 sm:grid-cols-2 sm:gap-10">
          {/* Round 1 — the industry panel. */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
              Round 1 · Preliminary
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink">
              Local AI industry leaders
            </h3>
            <p className="mt-3 text-base leading-relaxed text-ink/70">
              Working AI engineers and technology leaders review every
              submission and advance the top teams to the finals.
            </p>
            <JudgeList judges={INDUSTRY_PANEL} />
          </div>

          {/* Round 2 — the Cocoa Dolce panel. */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
              Round 2 · Finals
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink">
              Cocoa Dolce leadership
            </h3>
            <p className="mt-3 text-base leading-relaxed text-ink/70">
              Finalists present live on stage, where the people who run the
              business pick the winners.
            </p>
            <JudgeList judges={FINALS_PANEL} />
          </div>
        </div>

        <p className="mt-14 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          Final presentations are open to the public
        </p>
      </div>
    </section>
  );
}
