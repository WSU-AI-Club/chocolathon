/* Rank one track. Means, not sums, so a team with three judges is not
   favored over one with two. Order: mean total, then the rubric's
   tie-break (line 1, line 2, median judge total). Excluded and unscored
   rows sink with no rank. Finalist line after third; a two-way tie at
   third makes four; a wider tie stops the line at second and flags. */
import type { Submission } from "../judge/mapRows";
import { GATE_LABELS, type JudgingConfig, type Score, type Track } from "./types";

export type TeamRow = {
  teamKey: string; team: string; track: Track; prompt: string;
  scores: Score[]; counted: Score[]; judgeCount: number;
  mean: number | null; meanLine1: number | null; meanLine2: number | null; medianTotal: number | null;
  rank: number | null; finalist: boolean; flags: string[]; excluded: boolean;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const keys = (r: TeamRow) => [r.mean ?? -1, r.meanLine1 ?? -1, r.meanLine2 ?? -1, r.medianTotal ?? -1];

export function compareRows(a: TeamRow, b: TeamRow): number {
  if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
  const ka = keys(a), kb = keys(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
  return a.team.localeCompare(b.team);
}
const sameKeys = (a: TeamRow, b: TeamRow) => keys(a).every((v, i) => v === keys(b)[i]);

export function rankTrack(track: Track, submissions: Submission[], scores: Score[], config: JudgingConfig, judgeName: (id: string) => string): TeamRow[] {
  const rows: TeamRow[] = submissions
    .filter((s) => s.track === track && !s.duplicateOf)
    .map((s) => {
      const mine = scores.filter((x) => x.teamKey === s.teamKey);
      const counted = mine.filter((x) => !x.recused && x.lines && x.total !== null);
      const totals = counted.map((x) => x.total as number);
      const flags: string[] = [];
      const excluded = config.excluded.includes(s.teamKey);
      if (excluded) flags.push("Excluded");
      if (counted.length < 2) flags.push("Under two judges");
      if (s.alsoIn) flags.push(`Also entered in the ${s.alsoIn} track`);
      for (const x of mine) {
        if (x.recused) flags.push(`Recused: ${judgeName(x.judgeId)}`);
        for (const [g, passes] of Object.entries(x.gates)) {
          if (!passes) flags.push(`Gate failed: ${GATE_LABELS[g as keyof typeof GATE_LABELS]} (${judgeName(x.judgeId)})`);
        }
      }
      return {
        teamKey: s.teamKey, team: s.team, track, prompt: s.prompt || s.promptRaw,
        scores: mine, counted, judgeCount: counted.length,
        mean: mean(totals), meanLine1: mean(counted.map((x) => x.lines![0])), meanLine2: mean(counted.map((x) => x.lines![1])),
        medianTotal: median(totals), rank: null, finalist: false, flags, excluded,
      };
    })
    .sort(compareRows);

  let rank = 0;
  for (const r of rows) if (!r.excluded && r.mean !== null) r.rank = ++rank;

  const ranked = rows.filter((r) => r.rank !== null);
  let cut = Math.min(3, ranked.length);
  if (ranked.length > 3 && sameKeys(ranked[2], ranked[3])) {
    const tied = ranked.filter((r) => sameKeys(r, ranked[2]));
    if (tied.length === 2) cut = 4;
    else {
      cut = ranked.indexOf(tied[0]);
      for (const r of tied) r.flags.push("Tie at the cut: leadership decides");
    }
  }
  ranked.slice(0, cut).forEach((r) => (r.finalist = true));
  return rows;
}
