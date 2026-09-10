/* One track's rubric: the track name as a heading, then the four
   criteria in the display face, each with its 1 / 5 / 10 anchors set
   small beneath. Two of these sit side by side on HQ (Build | Pitch)
   and one at a time on the judge page. The criteria carry the size so a
   team sees at a glance what it is judged on; the anchors explain. */

import type { Block } from "./types";

type Rubric = Extract<Block, { kind: "rubric" }>;

const ANCHORS: Array<["low" | "mid" | "high", string]> = [
  ["low", "1"],
  ["mid", "5"],
  ["high", "10"],
];

export default function RubricView({ rubric }: { rubric: Rubric }) {
  return (
    <div>
      <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
        {rubric.label}
      </h3>
      <p className="label mt-2">Four lines · each scored 1 to 10</p>
      <ol className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
        {rubric.items.map((c, i) => (
          <li key={c.name} className="py-5">
            <p className="flex gap-3 font-display text-xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.375rem]">
              <span className="w-5 shrink-0 text-goldink">{i + 1}</span>
              <span>{c.name}</span>
            </p>
            <dl className="mt-3 space-y-1.5 pl-8">
              {ANCHORS.map(([key, mark]) => (
                <div key={key} className="flex gap-3 text-sm leading-snug text-ink/80">
                  <dt className="label w-5 shrink-0 pt-px text-right !text-[11px] tabular-nums">
                    {mark}
                  </dt>
                  <dd>{c[key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
