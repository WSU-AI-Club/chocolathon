/* The two track rubrics side by side, ROW-ALIGNED (2026-09-10).

   Two independent RubricView columns drifted: Build's line 3 sat
   opposite Pitch's line 2 as soon as one anchor wrapped. This renders
   both tracks into ONE grid — headers, then line 1 of each track in the
   same grid row, line 2 in the next — so the numbers always face each
   other. The criterion line reserves two lines of height so the anchors
   underneath start level too.

   Phones get the stacked RubricView instead (interleaving two tracks in
   one column would read as nonsense); the judge page still uses
   RubricView for one track at a time. */

import type { Block } from "./types";

type Rubric = Extract<Block, { kind: "rubric" }>;

const ANCHORS: Array<["low" | "mid" | "high", string]> = [
  ["low", "1"],
  ["mid", "5"],
  ["high", "10"],
];

export default function RubricPair({ rubrics }: { rubrics: Rubric[] }) {
  const lines = Math.max(...rubrics.map((r) => r.items.length));
  return (
    <>
      {/* One line for both columns: printing it under each heading was
          the same sentence twice, side by side. */}
      <p className="label mt-8">Four lines per track · each scored 1 to 10</p>
      <div className="mt-4 grid grid-cols-2 gap-x-10">
        {rubrics.map((r) => (
          <h3
            key={r.label}
            className="pb-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink"
          >
            {r.label}
          </h3>
        ))}

        {Array.from({ length: lines }).flatMap((_, i) =>
          rubrics.map((r) => {
            const c = r.items[i];
            const last = i === lines - 1;
            return (
              <div
                key={`${r.label}-${i}`}
                className={
                  "border-t border-ink/10 py-5" + (last ? " border-b" : "")
                }
              >
                <p className="flex min-h-[3.75rem] gap-3 font-display text-xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.375rem]">
                  <span className="w-5 shrink-0 tabular-nums text-goldink">
                    {i + 1}
                  </span>
                  <span>{c?.name}</span>
                </p>
                <dl className="space-y-1.5 pl-8">
                  {ANCHORS.map(([key, mark]) => (
                    <div
                      key={key}
                      className="flex gap-3 text-sm leading-snug text-ink/80"
                    >
                      <dt className="label w-5 shrink-0 pt-px text-right !text-[11px] tabular-nums">
                        {mark}
                      </dt>
                      <dd>{c?.[key]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          }),
        )}
      </div>
    </>
  );
}
