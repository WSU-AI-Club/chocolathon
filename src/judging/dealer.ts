/* Deal teams to judges. Per track, teams in export order each go to the
   k least-loaded eligible judges (ties broken by the judges list order),
   so every team gets k distinct judges and no judge ends up carrying
   more than one team over another, even a "both" judge who also picks
   up load from the other track. Deterministic: same inputs, same hands
   (a stable sort, no randomness). Michael edits by hand after.

   `existing` (optional) makes this incremental: a team that already has
   at least `minPerTeam` judges in `existing` keeps exactly that list
   untouched (byte-identical); a team with some but fewer keeps them and
   gets topped up; a team with none is dealt fresh. A kept judge who is
   no longer on the track (moved to Off, or to the other track) is
   dropped from that team's kept list first, which puts the team back
   into the top-up path and produces a warning. Load is seeded from every
   kept assignment before any top-up or fresh deal runs, so new judging
   balances against real carried load, not just the teams being dealt
   this pass. */
import type { Submission } from "../judge/mapRows";
import type { Judge, Track } from "./types";

export type DealInput = {
  submissions: Pick<Submission, "teamKey" | "track" | "n" | "duplicateOf">[];
  judges: Judge[];
  minPerTeam: number;
  excluded: string[];
  existing?: Record<string, string[]>;
};
export type Deal = { assignments: Record<string, string[]>; load: Record<string, number>; warnings: string[] };

export function judgesForTrack(judges: Judge[], track: Track): Judge[] {
  return judges.filter((j) => j.tracks === track || j.tracks === "both");
}

export function deal({ submissions, judges, minPerTeam, excluded, existing = {} }: DealInput): Deal {
  const assignments: Record<string, string[]> = {};
  const load: Record<string, number> = {};
  const warnings: string[] = [];
  for (const j of judges) load[j.id] = 0;
  const k = Math.max(1, Math.floor(minPerTeam));

  for (const track of ["build", "pitch"] as Track[]) {
    const pool = judgesForTrack(judges, track).map((j) => j.id);
    const poolSet = new Set(pool);
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

    /* Split each team's existing judges into still-eligible (kept) and
       no-longer-eligible (dropped), and count drops per judge so one
       off/switched judge produces one warning naming every team it
       displaced. */
    const kept = new Map<string, string[]>();
    const dropCounts = new Map<string, number>();
    for (const t of teams) {
      const ex = existing[t.teamKey] ?? [];
      const stillIn = ex.filter((id) => poolSet.has(id));
      const droppedIds = ex.filter((id) => !poolSet.has(id));
      kept.set(t.teamKey, stillIn);
      for (const id of droppedIds) dropCounts.set(id, (dropCounts.get(id) ?? 0) + 1);
    }
    for (const [id, count] of dropCounts) {
      const jname = judges.find((j) => j.id === id)?.name ?? id;
      const trackLabel = track === "build" ? "Build" : "Pitch";
      warnings.push(
        `${jname} is off the ${trackLabel} track; ${count} team${count === 1 ? "" : "s"} ${count === 1 ? "was" : "were"} re-dealt.`,
      );
    }

    /* Seed load with everything already kept, before any top-up or
       fresh deal on this track runs. */
    for (const ids of kept.values()) for (const id of ids) load[id] = (load[id] ?? 0) + 1;

    for (const t of teams) {
      const keptIds = kept.get(t.teamKey) ?? [];
      if (keptIds.length >= k) {
        assignments[t.teamKey] = keptIds;
        continue;
      }
      const need = per - keptIds.length;
      const ranked = pool.filter((id) => !keptIds.includes(id)).sort((a, b) => load[a] - load[b]);
      const added = ranked.slice(0, Math.max(0, need));
      assignments[t.teamKey] = [...keptIds, ...added];
      for (const id of added) load[id] = (load[id] ?? 0) + 1;
    }
  }
  return { assignments, load, warnings };
}
