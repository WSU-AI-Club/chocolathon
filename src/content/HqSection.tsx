/* ═══════════════════════════════════════════════════════════════════
   COMPETITION HQ BAND — the landing page's door into everything else.

   The Tracks, Schedule, and Judges sections that used to stack below
   the film moved into HQ on 2026-09-06 so every fact lives in one
   place. This band is what replaced them: one heading, six large
   links, each straight to its section of HQ. The prompts link carries
   the lock and the live countdown so the state is visible before the
   click; it is the only locked control here (2026-09-06). The
   submissions button lives in HQ.

   Not cards. Each entry is a link block with a Fraunces title and one
   line, in a two-column grid, ruled not boxed.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

import { HQ_PATH, PEOPLE_PATH } from "./links";
import PromptsButton from "./PromptsButton";

/* `href` overrides the default HQ anchor; the people page is its own
   route (2026-09-10). */
const ENTRIES: Array<{ id: string; title: string; line: string; href?: string }> = [
  {
    id: "tracks",
    title: "Tracks",
    line: "Build a working tool, or pitch the case. Different prompts on each side, and what each pays.",
  },
  {
    id: "lovable",
    title: "Lovable credits",
    line: "How to claim your build credits, and the fastest way to learn the tool.",
  },
  {
    id: "schedule",
    title: "Schedule",
    line: "Finale day at Woolsey Hall, hour by hour: sessions, submissions, finals, winners.",
  },
  {
    id: "people",
    title: "Judges and speakers",
    line: "Three industry sessions, the preliminary panel, and the Cocoa Dolce leadership who pick the winners.",
    href: PEOPLE_PATH,
  },
  {
    id: "rubric",
    title: "The rubric",
    line: "Four gates, four lines per track at 1 to 10, how teams advance, and how the finals are decided.",
  },
  {
    id: "rules",
    title: "Rules",
    line: "Teams, eligibility, and what counts as your own work.",
  },
  {
    id: "submissions",
    title: "Submissions",
    line: "What the form asks for on Saturday, 1:00 to 2:00 PM, so you have it ready.",
  },
  {
    id: "faq",
    title: "FAQ",
    line: "Switching tracks, changing teams, using AI, being there all day.",
  },
];

/* One switch lives in api/_content.ts (`RESULTS.published`); the band
   asks the server for it so the landing page and HQ flip together. A
   failed fetch means no Results row, never a broken one. */
function useResultsPublished(): boolean {
  const [published, setPublished] = useState(false);
  useEffect(() => {
    fetch("/api/hub", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPublished(!!d?.results?.published))
      .catch(() => setPublished(false));
  }, []);
  return published;
}

export default function HqSection() {
  const resultsPublished = useResultsPublished();
  return (
    <section id="hq" className="border-t border-ink/10 bg-white px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Competition HQ.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            Everything a team needs, on one page. The prompts land here at
            midnight on September 14.
          </p>
        </div>

        {resultsPublished ? (
          <div className="mt-12 flex flex-col gap-5 border-t border-ink/15 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                The results
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink/80">
                Who won, who placed, and what they built.
              </p>
            </div>
            <a className="btn-cta shrink-0" href={`${HQ_PATH}#results`}>
              See the results
              <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : null}

        {/* The prompts entry is the one that changes state, so it gets the
            full-width row and the button itself. */}
        <div className={(resultsPublished ? "" : "mt-10 sm:mt-12 ") + "flex flex-col gap-5 border-t border-ink/15 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-8"}>
          <div>
            <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
              The prompts
            </h3>
            <p className="mt-2 text-base leading-relaxed text-ink/80">
              Eight challenges, four per track, written with Cocoa Dolce.
            </p>
          </div>
          <PromptsButton className="shrink-0" />
        </div>

        <ul className="grid gap-x-12 sm:grid-cols-2">
          {ENTRIES.map((e, i) => (
            <li
              key={e.id}
              /* Five entries in two columns leaves one alone; the last
                 spans the row so the grid closes cleanly. */
              className={"border-t border-ink/15" + (i === ENTRIES.length - 1 && ENTRIES.length % 2 === 1 ? " sm:col-span-2" : "")}
            >
              <a
                href={e.href ?? `${HQ_PATH}#${e.id}`}
                className="group flex items-start justify-between gap-6 py-5 no-underline sm:py-7"
              >
                <span className="min-w-0">
                  <span className="block font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
                    {e.title}
                  </span>
                  <span className="mt-2 block text-base leading-relaxed text-ink/80">
                    {e.line}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1.5 shrink-0 font-display text-2xl text-ink/70 transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
