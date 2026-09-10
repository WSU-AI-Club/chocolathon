/* One rubric: numbered criteria, each with its 1 / 5 / 10 anchors.
   Used by the HQ Judges section (public) and the judge page (the same
   content, so a judge reads exactly what the teams read). Anchors stay
   open on phones on purpose: they are what a team scans for. */

import type { Block } from "./types";

type Rubric = Extract<Block, { kind: "rubric" }>;

export default function RubricView({ rubric }: { rubric: Rubric }) {
  return (
    <ol className="mt-3 max-w-2xl space-y-6">
      {rubric.items.map((c, i) => (
        <li key={c.name}>
          <p className="flex gap-3 text-base font-semibold leading-snug text-ink">
            <span className="font-display w-5 shrink-0 text-xl font-semibold leading-none text-goldink">
              {i + 1}
            </span>
            <span>{c.name}</span>
          </p>
          <dl className="mt-2 grid grid-cols-[1.75rem_1fr] gap-x-3 gap-y-1 pl-8 text-sm leading-relaxed text-ink/80">
            <dt className="label pt-0.5 !text-[11px] tabular-nums">1</dt>
            <dd>{c.low}</dd>
            <dt className="label pt-0.5 !text-[11px] tabular-nums">5</dt>
            <dd>{c.mid}</dd>
            <dt className="label pt-0.5 !text-[11px] tabular-nums">10</dt>
            <dd>{c.high}</dd>
          </dl>
        </li>
      ))}
    </ol>
  );
}
