/* The winners on the landing page (2026-09-19). Rendered only once
   RESULTS.published is flipped in api/_content.ts; until then the page
   is exactly what it was. It sits right after the film, before the HQ
   band, because after the event this is the news. First, second, and
   third in each track, ruled not boxed, and one button to the full
   list of submissions on HQ. Names and lines come from /api/hub, the
   same source HQ reads, so the two never disagree.

   Since 2026-09-20 each place carries its medal — gold, silver, bronze
   from ../competitor/medals — and the winners carry the scholarship
   they took home. */

import { HQ_PATH } from "./links";
import { Medal, PLACES, MEDALS, Prize } from "../competitor/medals";
import type { Place } from "../competitor/medals";
import type { Prompt, ResultEntry, Results } from "../competitor/types";

export default function WinnersSection({
  results,
  prompts,
}: {
  results: Results;
  prompts: Prompt[];
}) {
  if (!results.published) return null;
  const title = (id: string) => prompts.find((p) => p.id === id)?.title ?? "";
  return (
    <section id="winners" className="border-t border-ink/10 bg-white px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            The winners.
          </h2>
          {results.intro ? (
            <p className="mt-4 text-lg leading-relaxed text-ink/80">{results.intro}</p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-12 sm:grid-cols-2 sm:gap-x-12">
          {results.tracks.map((t) => (
            <div key={t.track}>
              <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                {t.track === "build" ? "Build Track" : "Pitch Track"}
              </h3>
              <ol className="mt-4">
                {PLACES.map((p) => (
                  <PlaceRow key={p} place={p} entry={t[p]} title={title} />
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a className="btn-cta" href={`${HQ_PATH}#results`}>
            Every submission
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* The medal sits in its own column so the three rows line up on one
   edge however long a team name runs. */
function PlaceRow({
  place,
  entry,
  title,
}: {
  place: Place;
  entry: ResultEntry;
  title: (id: string) => string;
}) {
  if (!entry.team) return null;
  const m = MEDALS[place];
  const promptTitle = title(entry.prompt);
  return (
    <li className="grid grid-cols-[2.25rem_1fr] gap-x-4 border-t border-ink/10 py-5">
      <Medal place={place} className="mt-1" />
      <div className="min-w-0">
        <p className={`label ${m.text}`}>
          {m.metal} · {m.label}
        </p>
        <p className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
          {entry.team}
        </p>
        {entry.prompt ? (
          <p className="label mt-2">
            {entry.prompt}
            {promptTitle ? ` · ${promptTitle}` : ""}
          </p>
        ) : null}
        <Prize prize={entry.prize} note={entry.prizeNote} className="mt-3" />
        {entry.line ? (
          <p className="mt-2 text-base leading-relaxed text-ink/80">{entry.line}</p>
        ) : null}
      </div>
    </li>
  );
}
