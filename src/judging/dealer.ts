/* Deal teams to judges. Per track, teams in export order each go to the
   k least-loaded eligible judges (ties broken by the judges list order),
   so every team gets k distinct judges and no judge ends up carrying
   more than one team over another, even a "both" judge who also picks
   up load from the other track. Deterministic: same inputs, same hands
   (a stable sort, no randomness). Michael edits by hand after. */
import type { Submission } from "../judge/mapRows";
import type { Judge, Track } from "./types";

export type DealInput = {
  submissions: Pick<Submission, "teamKey" | "track" | "n" | "duplicateOf">[];
  judges: Judge[];
  minPerTeam: number;
  excluded: string[];
};
export type Deal = { assignments: Record<string, string[]>; load: Record<string, number>; warnings: string[] };

export function judgesForTrack(judges: Judge[], track: Track): Judge[] {
  return judges.filter((j) => j.tracks === track || j.tracks === "both");
}

export function deal({ submissions, judges, minPerTeam, excluded }: DealInput): Deal {
  const assignments: Record<string, string[]> = {};
  const load: Record<string, number> = {};
  const warnings: string[] = [];
  for (const j of judges) load[j.id] = 0;
  const k = Math.max(1, Math.floor(minPerTeam));

  for (const track of ["build", "pitch"] as Track[]) {
    const pool = judgesForTrack(judges, track).map((j) => j.id);
    const teams = submissions
      .filter((s) => s.track === track && !s.duplicateOf && !excluded.includes(s.teamKey))
      .sort((a, b) => a.n - b.n);
    if (teams.length === 0) continue;
    if (pool.length === 0) {
      warnings.push(`No judge is set to the ${track} track. ${teams.length} teams have nobody.`);
      for (const t of teams) assignments[t.teamKey] = [];
      continue;
    }
    if (pool.length < k) {
      warnings.push(`Only ${pool.length} judge${pool.length === 1 ? "" : "s"} on the ${track} track, fewer than the minimum of ${k}. Every ${track} team goes to all of them.`);
    }
    const per = Math.min(k, pool.length);
    for (const t of teams) {
      const ranked = [...pool].sort((a, b) => load[a] - load[b]);
      const ids = ranked.slice(0, per);
      assignments[t.teamKey] = ids;
      for (const id of ids) load[id] = (load[id] ?? 0) + 1;
    }
  }
  return { assignments, load, warnings };
}
