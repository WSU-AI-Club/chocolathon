/* One track's rubric as a scale you can read left to right (2026-09-19).

   Before this the three anchors stacked under each criterion, so a
   reader parsed "1 / 5 / 10" as three sentences and the two tracks sat
   side by side, each column a wall of small text. Now each line is one
   row: the criterion in the display face, then its 1, 5, and 10 anchors
   in three columns under a shared header, so the eye travels along the
   scale the same way the judge's finger travels along the ten buttons.
   The 10 column is set in full ink and the others softer: the point of
   the row is what a great one looks like. Tracks stack (Build, then
   Pitch); the side-by-side pair (RubricPair, 2026-09-10) is retired.

   On a phone the row folds: criterion, then the three anchors stacked
   with their mark inline, since three columns of prose do not fit. */

import type { Block } from "./types";

type Rubric = Extract<Block, { kind: "rubric" }>;

const ANCHORS: Array<{ key: "low" | "mid" | "high"; mark: string; tone: string }> = [
  { key: "low", mark: "1", tone: "text-ink/70" },
  { key: "mid", mark: "5", tone: "text-ink/70" },
  { key: "high", mark: "10", tone: "font-medium text-ink" },
];

const COLS = "sm:grid-cols-[minmax(0,1.1fr)_1fr_1fr_1fr]";

export default function RubricView({ rubric }: { rubric: Rubric }) {
  return (
    <div>
      <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
        {rubric.label}
      </h3>
      <p className="label mt-2">Four lines · each scored 1 to 10</p>

      <div className="mt-5 border-t border-ink/15">
        {/* The header row names the scale once for the whole table. */}
        <div className={`hidden gap-x-5 border-b border-ink/10 py-2.5 sm:grid ${COLS}`}>
          <span className="label">The line</span>
          {ANCHORS.map((a) => (
            <span
              key={a.key}
              className={"label tabular-nums" + (a.key === "high" ? " label-strong" : "")}
            >
              {a.mark}
            </span>
          ))}
        </div>

        <ol>
          {rubric.items.map((c, i) => (
            <li
              key={c.name}
              className={`grid gap-x-5 gap-y-2.5 border-b border-ink/10 py-5 ${COLS}`}
            >
              <p className="flex gap-3 font-display text-xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.375rem]">
                <span className="w-5 shrink-0 tabular-nums text-goldink">{i + 1}</span>
                <span>{c.name}</span>
              </p>
              {ANCHORS.map((a) => (
                <p
                  key={a.key}
                  className={`flex gap-3 pl-8 text-sm leading-snug sm:block sm:pl-0 ${a.tone}`}
                >
                  <span className="label w-5 shrink-0 pt-px text-right !text-[11px] tabular-nums sm:hidden">
                    {a.mark}
                  </span>
                  <span>{c[a.key]}</span>
                </p>
              ))}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
