/* ═══════════════════════════════════════════════════════════════════
   RESULTS PAGE — the live ranking, for Michael only.

   Behind the same upload key as the upload page (same localStorage
   name, so he types it once across both). Loads submissions, the
   judging config, and every saved score, then ranks each track with
   the shared ranking math. Refreshes itself every 30 seconds so it can
   sit open on a second screen during judging. Export produces the
   three-sheet workbook; Close/Reopen and Exclude/Include write straight
   back to /api/judging-config.

   Unlisted like the judge and upload pages; the key is what protects
   the reads and writes, not the URL.
   ═══════════════════════════════════════════════════════════════════ */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Judging } from "../judge/mapRows";
import { downloadWorkbook } from "../judging/exportXlsx";
import { rankTrack, type TeamRow } from "../judging/ranking";
import { GATE_LABELS, type JudgingConfig, type Score } from "../judging/types";
import "../chocolathon.css";

const KEY_STORAGE = "choco-upload-key";
const REFRESH_MS = 30_000;

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}
/* The stamp inside the stale-data sentence: minutes are enough there. */
function fmtStamp(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmt(n: number | null): string {
  return n === null ? "—" : n.toFixed(2);
}

export default function ResultsPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [judging, setJudging] = useState<Judging | null>(null);
  const [config, setConfig] = useState<JudgingConfig | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  /* loadAll has no dependencies so the 30 second timer never rebuilds it;
     the last good time has to reach it through a ref. */
  const updatedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    document.title = "Chocolathon — Ranking";
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  /* A refresh that fails keeps what is already on the screen. Wiping the
     table on a 500 made a server problem look like every judge scoring
     nothing, which is the one lie this page must never tell. */
  const loadAll = useCallback(async (k: string) => {
    const fail = (what: string) => {
      const at = updatedAtRef.current;
      setLoadError(
        `Could not load the latest scores (${what}).` +
          (at ? ` Showing the data from ${fmtStamp(at)}.` : ""),
      );
    };
    const withKey = { cache: "no-store" as const, headers: { "x-upload-key": k } };
    try {
      const [jRes, cRes, sRes] = await Promise.all([
        fetch("/api/judging", withKey),
        fetch("/api/judging-config", withKey),
        fetch("/api/scores?all=1", withKey),
      ]);
      if (jRes.status === 401 || cRes.status === 401 || sRes.status === 401) {
        setAuthed(false);
        const body = await sRes.json().catch(() => ({}));
        setAuthError(body?.error ?? "Wrong upload key.");
        return;
      }
      setAuthed(true);
      setAuthError(null);
      /* 404 on the submissions or the config is not a failure: it is the
         quiet state before Michael publishes at 2:00. Anything else is. */
      if (!sRes.ok) return fail(String(sRes.status));
      if (!jRes.ok && jRes.status !== 404) return fail(String(jRes.status));
      if (!cRes.ok && cRes.status !== 404) return fail(String(cRes.status));

      /* Read and check all three bodies BEFORE anything reaches the
         screen. Committing the scores first and then failing on the
         submissions left new scores ranked against the old team list,
         with a stamp that said the page was current. Either all four
         values move together or none of them do. */
      const scoreBody = (await sRes.json().catch(() => null)) as { scores?: Score[] } | null;
      if (!scoreBody || !Array.isArray(scoreBody.scores)) return fail("unreadable scores");
      const nextJudging = jRes.ok ? ((await jRes.json().catch(() => null)) as Judging | null) : null;
      if (jRes.ok && (!nextJudging || !Array.isArray(nextJudging.submissions))) {
        return fail("unreadable submissions");
      }
      const nextConfig = cRes.ok ? ((await cRes.json().catch(() => null)) as JudgingConfig | null) : null;
      if (cRes.ok && (!nextConfig || !Array.isArray(nextConfig.judges))) {
        return fail("unreadable config");
      }

      setScores(scoreBody.scores);
      setJudging(nextJudging);
      setConfig(nextConfig);
      setLoadError(null);
      const now = new Date();
      updatedAtRef.current = now;
      setUpdatedAt(now);
    } catch {
      fail("no connection");
    }
  }, []);

  useEffect(() => {
    let stored = "";
    try {
      stored = localStorage.getItem(KEY_STORAGE) ?? "";
    } catch {
      /* private window; the field starts empty */
    }
    if (stored) {
      setKey(stored);
      void loadAll(stored);
    }
  }, [loadAll]);

  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => void loadAll(key), REFRESH_MS);
    return () => clearInterval(id);
  }, [authed, key, loadAll]);

  async function unlock() {
    const k = key.trim();
    if (!k || authBusy) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      localStorage.setItem(KEY_STORAGE, k);
    } catch {
      /* fine */
    }
    await loadAll(k);
    setAuthBusy(false);
  }

  /* Sends only what changed. The server merges it into the stored config
     and returns the whole thing, so this page picks up anything the
     upload page wrote in the meantime instead of overwriting it. */
  async function postConfig(patch: Partial<JudgingConfig>): Promise<boolean> {
    try {
      const r = await fetch("/api/judging-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-upload-key": key.trim() },
        body: JSON.stringify(patch),
      });
      const j = (await r.json().catch(() => null)) as (JudgingConfig & { error?: string }) | null;
      if (!r.ok) {
        setSaveError(j?.error ?? `Save failed (${r.status}).`);
        return false;
      }
      if (j && Array.isArray(j.judges)) setConfig(j);
      setSaveError(null);
      return true;
    } catch {
      setSaveError("Could not reach the server. Check your connection and try again.");
      return false;
    }
  }

  async function toggleClosed() {
    if (!config) return;
    setBusyAction("closed");
    await postConfig({ closed: !config.closed });
    setBusyAction(null);
  }

  async function toggleExcluded(teamKey: string) {
    if (!config) return;
    setBusyAction(teamKey);
    const excluded = config.excluded.includes(teamKey)
      ? config.excluded.filter((k) => k !== teamKey)
      : [...config.excluded, teamKey];
    await postConfig({ excluded });
    setBusyAction(null);
  }

  /* Judges are letters on this page (Michael, 2026-09-19): one letter per
     judge for the whole event, in the order of the judging config, so the
     screen can be shown to anyone and a harsh judge is still visible across
     teams. Names stay in the config and on the "All scores" export sheet. */
  const judgeName = useCallback(
    (id: string) => {
      const i = config?.judges.findIndex((j) => j.id === id) ?? -1;
      return i >= 0 ? `Judge ${String.fromCharCode(65 + i)}` : "Judge";
    },
    [config],
  );

  const buildRows = useMemo(
    () => (judging && config ? rankTrack("build", judging.submissions, scores, config, judgeName) : []),
    [judging, config, scores, judgeName],
  );
  const pitchRows = useMemo(
    () => (judging && config ? rankTrack("pitch", judging.submissions, scores, config, judgeName) : []),
    [judging, config, scores, judgeName],
  );
  const allRows = useMemo(() => [...buildRows, ...pitchRows], [buildRows, pitchRows]);
  const teamsCount = allRows.filter((r) => !r.excluded).length;
  const scoredCount = allRows.filter((r) => !r.excluded && r.judgeCount >= 2).length;
  const flagsCount = allRows.reduce((n, r) => n + r.flags.length, 0);

  function exportExcel() {
    if (!config) return;
    downloadWorkbook({ rows: allRows, config, exportedAt: new Date() });
  }

  if (!authed) {
    return (
      <div className="choco-root min-h-screen bg-white">
        <main className="mx-auto max-w-md px-5 py-24 sm:px-8">
          <p className="label label-strong">Chocolathon · Ranking</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.02] tracking-tight text-ink">
            Enter the upload key.
          </h1>
          <label className="mt-8 block">
            <span className="label">Upload key</span>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void unlock();
              }}
              autoComplete="off"
              className="mt-2 w-full border-0 border-b-2 border-ink/20 bg-transparent px-0 py-2 text-base text-ink outline-none focus:border-gold"
            />
          </label>
          {authError ? (
            <p role="alert" className="mt-4 border-l-2 border-gold pl-4 text-base text-ink">
              {authError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void unlock()}
            disabled={authBusy || !key.trim()}
            className="btn-cta mt-6 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {authBusy ? "Checking…" : "Unlock"}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="choco-root min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-5 pb-32 pt-16 sm:px-8">
        <p className="label label-strong">Chocolathon · Ranking</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          Ranking.
        </h1>

        {loadError ? (
          <p role="alert" className="mt-4 border-l-2 border-gold pl-4 text-base text-ink">
            {loadError}
          </p>
        ) : null}

        {saveError ? (
          <p role="alert" className="mt-4 border-l-2 border-gold pl-4 text-base text-ink">
            {saveError}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={exportExcel}
            disabled={!config || !judging || !!loadError}
            className="btn-cta disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void toggleClosed()}
            disabled={!config || busyAction === "closed"}
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
          >
            {config?.closed ? "Reopen judging" : "Close judging"}
          </button>
          <span className="label">{updatedAt ? `Updated ${fmtTime(updatedAt)}` : "Loading…"}</span>
          <button type="button" onClick={() => void loadAll(key)} className="btn-ghost-sm">
            Refresh now
          </button>
        </div>
        <p className="mt-2 text-sm text-ink/70">
          {loadError
            ? "Export is off while this page is showing older data. Refresh until it loads."
            : "Close judging first, then export, so the file matches what picked the finalists."}
        </p>

        <p className={"label mt-6" + (scoredCount < teamsCount ? " label-alert" : "")}>
          {scoredCount} of {teamsCount} teams have two or more judges · {flagsCount} flag
          {flagsCount === 1 ? "" : "s"}
        </p>

        {!judging ? (
          <p className="mt-8 text-base text-ink/80">Nothing published yet. Michael publishes at 2:00.</p>
        ) : !config ? (
          <p className="mt-8 text-base text-ink/80">The judges are not set up yet.</p>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <TrackTable
              label="Build Track."
              rows={buildRows}
              judgeName={judgeName}
              busyAction={busyAction}
              onToggleExcluded={(k) => void toggleExcluded(k)}
            />
            <TrackTable
              label="Pitch Track."
              rows={pitchRows}
              judgeName={judgeName}
              busyAction={busyAction}
              onToggleExcluded={(k) => void toggleExcluded(k)}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function TrackTable({
  label,
  rows,
  judgeName,
  busyAction,
  onToggleExcluded,
}: {
  label: string;
  rows: TeamRow[];
  judgeName: (id: string) => string;
  busyAction: string | null;
  onToggleExcluded: (teamKey: string) => void;
}) {
  const active = rows.filter((r) => !r.excluded);
  const excluded = rows.filter((r) => r.excluded);
  const lastFinalistIndex = active.reduce((acc, r, i) => (r.finalist ? i : acc), -1);

  return (
    <section className="min-w-0">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{label}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/15 text-left">
              <th className="label py-2 pr-2">#</th>
              <th className="label py-2 pr-2">Team</th>
              <th className="label py-2 pr-2">Prompt</th>
              <th className="label py-2 pr-2">Mean</th>
              <th className="label py-2 pr-2">Judges</th>
              <th className="label whitespace-nowrap py-2 pr-2" title="Tie-break: mean score on rubric line 1">
                Line 1
              </th>
              <th className="label whitespace-nowrap py-2 pr-2" title="Tie-break: mean score on rubric line 2">
                Line 2
              </th>
              <th className="label py-2 pr-2" title="Tie-break: median judge total">
                Median
              </th>
              <th className="label py-2 pr-2">Flags</th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-4 text-sm text-ink/60">
                  No teams in this track.
                </td>
              </tr>
            ) : null}
            {active.map((r, i) => (
              <Fragment key={r.teamKey}>
                <TeamRowLine r={r} judgeName={judgeName} busy={busyAction === r.teamKey} onToggleExcluded={onToggleExcluded} label="Exclude" />
                {i === lastFinalistIndex ? (
                  <tr>
                    <td colSpan={9} className="border-t-2 border-gold py-2 text-center">
                      <span className="label label-accent">Finalists above this line</span>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {excluded.length ? (
        <div className="mt-6">
          <p className="label text-ink/50">Excluded</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-sm text-ink/50">
              <tbody>
                {excluded.map((r) => (
                  <TeamRowLine
                    key={r.teamKey}
                    r={r}
                    judgeName={judgeName}
                    busy={busyAction === r.teamKey}
                    onToggleExcluded={onToggleExcluded}
                    label="Include"
                    muted
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TeamRowLine({
  r,
  judgeName,
  busy,
  onToggleExcluded,
  label,
  muted,
}: {
  r: TeamRow;
  judgeName: (id: string) => string;
  busy: boolean;
  onToggleExcluded: (teamKey: string) => void;
  label: string;
  muted?: boolean;
}) {
  return (
    <tr className={"border-b border-ink/10 align-top" + (muted ? "" : "")}>
      <td className={"py-2 pr-2 text-ink/80" + (r.finalist ? " border-l-2 border-gold pl-2" : "")}>
        {r.rank ?? "—"}
      </td>
      <td className="py-2 pr-2">
        <details>
          <summary className={"cursor-pointer font-semibold" + (muted ? " text-ink/50" : " text-ink")}>
            {r.team}
          </summary>
          <div className="mt-2 space-y-2 text-xs">
            {r.scores.length === 0 ? <p className="text-ink/60">No scores yet.</p> : null}
            {r.scores.map((s) => (
              <div key={s.judgeId} className="border-l-2 border-ink/10 pl-3">
                <p className="font-semibold text-ink">{judgeName(s.judgeId)}</p>
                {s.recused ? (
                  <p className="text-ink/70">Recused.</p>
                ) : s.lines ? (
                  <p className="text-ink/70">
                    {s.lines.join(" · ")} = {s.total}
                  </p>
                ) : (
                  <p className="text-ink/70">
                    Gate failed:{" "}
                    {Object.entries(s.gates)
                      .filter(([, ok]) => !ok)
                      .map(([g]) => GATE_LABELS[g as keyof typeof GATE_LABELS])
                      .join(" ")}
                  </p>
                )}
                {s.comment ? <p className="italic text-ink/70">{s.comment}</p> : null}
              </div>
            ))}
          </div>
        </details>
      </td>
      <td className="py-2 pr-2 text-ink/80">{r.prompt}</td>
      <td className="py-2 pr-2 text-ink/80">{fmt(r.mean)}</td>
      <td className={"py-2 pr-2" + (r.judgeCount < 2 ? " label-alert" : " text-ink/80")}>{r.judgeCount}</td>
      <td className="py-2 pr-2 text-ink/80">{fmt(r.meanLine1)}</td>
      <td className="py-2 pr-2 text-ink/80">{fmt(r.meanLine2)}</td>
      <td className="py-2 pr-2 text-ink/80">{fmt(r.medianTotal)}</td>
      <td className="max-w-[14rem] py-2 pr-2 align-top text-xs text-ink/70">
        {r.flags.length ? <p className="mb-1">{r.flags.join("; ")}</p> : null}
        <button
          type="button"
          onClick={() => onToggleExcluded(r.teamKey)}
          disabled={busy}
          className="btn-ghost-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {label}
        </button>
      </td>
    </tr>
  );
}
