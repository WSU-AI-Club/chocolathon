/* ═══════════════════════════════════════════════════════════════════
   ASSIGNMENT PANEL — who judges what.

   Lives on the upload page, under the publish block. Reads the live
   submissions (what judges already see), lets Michael set each judge's
   track, deals teams to judges with the least-loaded dealer, and hands
   the edited config to the parent's publish() to save with the upload
   key. Chips let Michael hand-edit any team after a deal.
   ═══════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";

import type { Judging } from "../judge/mapRows";
import { deal, judgesForTrack } from "../judging/dealer";
import { judgeId, type Judge, type JudgeTracks, type JudgingConfig } from "../judging/types";

const TRACKS: { value: JudgeTracks; label: string }[] = [
  { value: "build", label: "Build" },
  { value: "pitch", label: "Pitch" },
  { value: "both", label: "Both" },
  { value: "off", label: "Off" },
];

export default function AssignmentPanel({
  judging,
  config,
  scoreCount,
  onChange,
  publish,
  busy,
}: {
  judging: Judging | null;
  config: JudgingConfig;
  scoreCount: number;
  onChange: (c: JudgingConfig) => void;
  publish: (c: JudgingConfig) => Promise<void>;
  busy: boolean;
}) {
  const [newJudge, setNewJudge] = useState("");
  const [armed, setArmed] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof deal> | null>(null);
  const visible = useMemo(() => (judging?.submissions ?? []).filter((s) => !s.duplicateOf), [judging]);
  /* Without a live set, deal() has nothing to deal and would write an
     empty assignments map over a good one. */
  const canGenerate = judging !== null && visible.length > 0;
  const hasAssignments = Object.keys(config.assignments).length > 0;

  function setTracks(id: string, tracks: JudgeTracks) {
    onChange({ ...config, judges: config.judges.map((j) => (j.id === id ? { ...j, tracks } : j)) });
  }
  function addJudge() {
    const trimmed = newJudge.trim();
    if (!trimmed) return;
    const j: Judge = { id: judgeId(trimmed), name: trimmed, tracks: "off" };
    if (config.judges.some((x) => x.id === j.id)) return;
    onChange({ ...config, judges: [...config.judges, j] });
    setNewJudge("");
  }
  function generate() {
    if (!canGenerate) return;
    /* Any existing hand-edited assignment is worth a second click, scores
       or no scores: a deal replaces every one of them. */
    if (hasAssignments && !armed) {
      setArmed(true);
      return;
    }
    const d = deal({ submissions: visible, judges: config.judges, minPerTeam: config.minPerTeam, excluded: config.excluded });
    setResult(d);
    setArmed(false);
    onChange({ ...config, assignments: d.assignments });
  }
  function setTeamJudges(teamKey: string, ids: string[]) {
    onChange({ ...config, assignments: { ...config.assignments, [teamKey]: ids } });
  }
  const name = (id: string) => config.judges.find((j) => j.id === id)?.name ?? id;
  const load = (id: string) => Object.values(config.assignments).filter((ids) => ids.includes(id)).length;

  return (
    <div className="mt-6">
      <div className="space-y-4">
        {config.judges.map((j) => (
          <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <span className="text-base font-semibold text-ink">{j.name}</span>
            <div className="inline-flex gap-px overflow-hidden rounded-sm bg-ink/15 p-px" aria-label={`${j.name} track`}>
              {TRACKS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={j.tracks === t.value}
                  onClick={() => setTracks(j.id, t.value)}
                  className={
                    "label px-3 py-2 transition-colors " +
                    (j.tracks === t.value ? "bg-ink !text-white" : "bg-white hover:!text-ink")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {config.judges.length === 0 ? <p className="text-base text-ink/80">No judges yet. Add one below.</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1">
          <span className="label">Add a judge</span>
          <input
            type="text"
            value={newJudge}
            onChange={(e) => setNewJudge(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addJudge();
              }
            }}
            className="mt-2 w-full border-0 border-b-2 border-ink/20 bg-transparent px-0 py-2 text-base text-ink outline-none focus:border-gold"
          />
        </label>
        <button type="button" onClick={addJudge} className="btn-ghost-sm">
          Add
        </button>
      </div>

      <label className="mt-6 block max-w-xs">
        <span className="label">Minimum judges per team</span>
        <input
          type="number"
          min={1}
          max={6}
          value={config.minPerTeam}
          onChange={(e) => onChange({ ...config, minPerTeam: Math.min(6, Math.max(1, Number(e.target.value) || 1)) })}
          className="mt-2 w-full border-0 border-b-2 border-ink/20 bg-transparent px-0 py-2 text-base text-ink outline-none focus:border-gold"
        />
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generate
        </button>
        {!canGenerate ? <span className="label">Load the live set first.</span> : null}
        {canGenerate && armed ? (
          <span className="label label-accent">
            This replaces the current assignments. Click again to confirm.
          </span>
        ) : null}
        {canGenerate && scoreCount > 0 ? (
          <span className="label">
            {scoreCount} scores are saved. Regenerating changes who sees what, never the scores.
          </span>
        ) : null}
      </div>

      {result ? (
        <div className="mt-4 space-y-1 text-sm text-ink/80">
          {config.judges.map((j) => (
            <p key={j.id}>
              {j.name}: {load(j.id)} teams, about {Math.round(load(j.id) * 3.5)} minutes of video
            </p>
          ))}
        </div>
      ) : null}

      {result && result.warnings.length ? (
        <ul className="mt-3 space-y-1 text-sm text-amber-700">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 space-y-8">
        {(["build", "pitch"] as const).map((track) => {
          const teams = visible.filter((s) => s.track === track);
          if (!teams.length) return null;
          const eligible = judgesForTrack(config.judges, track);
          return (
            <div key={track}>
              <h3 className="label label-strong">{track === "build" ? "Build" : "Pitch"}</h3>
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                {teams.map((s) => {
                  const ids = config.assignments[s.teamKey] ?? [];
                  return (
                    <li key={s.teamKey} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <span className="text-base text-ink">{s.team}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {ids.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTeamJudges(s.teamKey, ids.filter((x) => x !== id))}
                            className="btn-ghost-sm"
                          >
                            {name(id)} ✕
                          </button>
                        ))}
                        <select
                          value=""
                          onChange={(e) => {
                            const id = e.target.value;
                            if (id) setTeamJudges(s.teamKey, [...ids, id]);
                          }}
                          className="border border-ink/20 bg-transparent px-2 py-1.5 text-sm text-ink"
                        >
                          <option value="">Add judge</option>
                          {eligible
                            .filter((j) => !ids.includes(j.id))
                            .map((j) => (
                              <option key={j.id} value={j.id}>
                                {j.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {visible.length === 0 ? <p className="text-base text-ink/80">Nothing published yet to assign.</p> : null}
      </div>

      <button
        type="button"
        onClick={() => void publish(config)}
        disabled={busy}
        className="btn-cta mt-8 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Publishing…" : "Publish assignments"}
      </button>
    </div>
  );
}
