/* ═══════════════════════════════════════════════════════════════════
   UPLOAD PAGE — drop the form export, publish it to the judges.

   For Michael at 2:00 on September 19. Drag the Excel workbook (or a
   CSV) that Microsoft Forms produced onto this page. It is parsed in the
   browser, the columns are matched the same way the command-line script
   matches them, a preview shows what the judges would see, and Publish
   sends it to /api/judging with the upload key. Nothing else on the site
   changes; the judge page reads the new set on refresh.

   The upload key is asked for once and kept in this browser. It is what
   protects the write and, since the reads carry team and student names,
   the reads too. The key field does NOT load on every keystroke: press
   Enter, leave the field, or click Load. Every load carries a sequence
   number and a late answer from an older load is thrown away, so a 401
   from a half-typed key can no longer land on top of a good one.

   Only a 404 from /api/judging-config means "nobody has published a
   config yet" and lets this page seed the judges from the public hub.
   Any other refusal leaves the config null and says so: seeding an empty
   config after a 500 and then saving it would write judges: [] over the
   real one, and that is the whole panel gone.

   Every write to the config sends only the fields this page owns, so
   publishing assignments can no longer revert the close switch or the
   exclusions the ranking page made a minute earlier. The one exception
   is the first save of a run that found no stored config: that one
   carries the whole seeded document, because a patch would merge into an
   empty default and create a config with no judges in it.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import type { HubData } from "../competitor/types";
import { JUDGE_PATH } from "../content/links";
import { mapRows, type Judging, type Submission } from "../judge/mapRows";
import { judgeId, type Judge, type JudgingConfig } from "../judging/types";
import AssignmentPanel from "./AssignmentPanel";
import "../chocolathon.css";

const KEY_STORAGE = "choco-upload-key";

type Parsed = {
  judging: Judging;
  missing: string[];
  headers: string[];
  dropped: Submission[];
  warnings: string[];
  optionalMissing: string[];
};

type LiveStatus = "needs-key" | "loading" | "ready" | "denied" | "error";

export default function UploadPage() {
  const [key, setKey] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishArmed, setPublishArmed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [live, setLive] = useState<{ count: number; publishedAt?: string } | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("needs-key");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [config, setConfig] = useState<JudgingConfig | null>(null);
  /* True once a GET returned a stored config, or once any save came back
     200. While it is false this page is holding a seeded document nobody
     has saved yet, and a partial patch would lose most of it. */
  const [storedConfigExists, setStoredConfigExists] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);
  const [configBusy, setConfigBusy] = useState(false);
  const [configResult, setConfigResult] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [scoreCount, setScoreCount] = useState(0);
  const [liveJudging, setLiveJudging] = useState<Judging | null>(null);
  const [clearArmed, setClearArmed] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);

  /* Every request that writes to the live-set state carries one of these.
     A response whose number is not the newest is dropped on the floor. */
  const seqRef = useRef(0);
  /* The key the last load ran with, so leaving the field does not refetch
     (and throw away unsaved panel edits) when nothing was typed. */
  const loadedKey = useRef<string | null>(null);

  /* One load for everything behind the key: the published set, the
     config, the saved score count, and the public judge list that seeds
     a first run. None of it goes out before the key field has content,
     because /api/judging and /api/judging-config now refuse a request
     without one. */
  const loadLive = useCallback(async (raw: string) => {
    const k = raw.trim();
    const seq = ++seqRef.current;
    const stale = () => seq !== seqRef.current;
    loadedKey.current = k;

    const forget = () => {
      setLive(null);
      setLiveJudging(null);
      setConfig(null);
      setStoredConfigExists(false);
      setConfigDirty(false);
      setScoreCount(0);
    };

    if (!k) {
      setLiveStatus("needs-key");
      setLoadError(null);
      forget();
      return;
    }
    setLiveStatus("loading");
    setLoadError(null);
    try {
      const withKey = { cache: "no-store" as const, headers: { "x-upload-key": k } };
      const [jRes, cRes, sRes, hubRes] = await Promise.all([
        fetch("/api/judging", withKey),
        fetch("/api/judging-config", withKey),
        fetch("/api/scores?all=1", withKey),
        fetch("/api/hub", { cache: "no-store" }),
      ]);
      if (stale()) return;

      if (jRes.status === 401 || cRes.status === 401 || sRes.status === 401) {
        setLiveStatus("denied");
        setLoadError(null);
        forget();
        return;
      }

      /* A 404 is the quiet state before anything is published. Anything
         else is a server that did not answer, and this page must not
         invent a document to stand in for what it could not read. */
      const refused = (what: string, status: number) => {
        setLoadError(`Could not load the ${what} (${status}). Nothing here is editable until it loads.`);
        setLiveStatus("error");
        forget();
      };

      if (!jRes.ok && jRes.status !== 404) return refused("published submissions", jRes.status);
      if (!cRes.ok && cRes.status !== 404) return refused("judging config", cRes.status);

      const nextJudging = jRes.ok ? ((await jRes.json().catch(() => null)) as Judging | null) : null;
      if (stale()) return;
      if (jRes.ok && (!nextJudging || !Array.isArray(nextJudging.submissions))) {
        return refused("published submissions", jRes.status);
      }

      const storedConfig = cRes.ok ? ((await cRes.json().catch(() => null)) as JudgingConfig | null) : null;
      if (stale()) return;
      if (cRes.ok && (!storedConfig || !Array.isArray(storedConfig.judges))) {
        return refused("judging config", cRes.status);
      }

      let nextConfig = storedConfig;
      if (!nextConfig) {
        /* First run, and a real 404 proved it: no config yet, so seed the
           judges from the public hub with every one of them switched off. */
        const hub = hubRes.ok ? ((await hubRes.json().catch(() => null)) as HubData | null) : null;
        if (stale()) return;
        const judges: Judge[] = (hub?.people.preliminary ?? []).map((p) => ({
          id: judgeId(p.name),
          name: p.name,
          tracks: "off",
        }));
        nextConfig = { judges, minPerTeam: 2, assignments: {}, excluded: [], closed: false };
      }

      let nextScoreCount = 0;
      if (sRes.ok) {
        const body = await sRes.json().catch(() => ({}));
        if (stale()) return;
        nextScoreCount = Array.isArray(body?.scores) ? body.scores.length : 0;
      }

      setLive(nextJudging ? { count: nextJudging.count, publishedAt: nextJudging.publishedAt } : null);
      setLiveJudging(nextJudging);
      setConfig(nextConfig);
      setStoredConfigExists(!!storedConfig);
      setConfigDirty(false);
      setScoreCount(nextScoreCount);
      setLoadError(null);
      try {
        localStorage.setItem(KEY_STORAGE, k);
      } catch {
        /* private window; he types it again next time */
      }
      setLiveStatus("ready");
    } catch {
      if (stale()) return;
      setLoadError("Could not reach the server. Nothing here is editable until it loads.");
      setLiveStatus("error");
      forget();
    }
  }, []);

  /* What a finished publish needs: the new live set and the score count,
     and nothing else. It must never touch the config, or publishing the
     file would revert whatever is half-edited in the assignment panel. */
  const refreshLiveSet = useCallback(async (raw: string) => {
    const k = raw.trim();
    if (!k) return;
    const seq = ++seqRef.current;
    const stale = () => seq !== seqRef.current;
    try {
      const withKey = { cache: "no-store" as const, headers: { "x-upload-key": k } };
      const [jRes, sRes] = await Promise.all([
        fetch("/api/judging", withKey),
        fetch("/api/scores?all=1", withKey),
      ]);
      if (stale()) return;
      if (jRes.ok) {
        const j = (await jRes.json().catch(() => null)) as Judging | null;
        if (stale()) return;
        if (j && Array.isArray(j.submissions)) {
          setLive({ count: j.count, publishedAt: j.publishedAt });
          setLiveJudging(j);
        }
      } else if (jRes.status === 404) {
        setLive(null);
        setLiveJudging(null);
      }
      if (sRes.ok) {
        const body = await sRes.json().catch(() => ({}));
        if (stale()) return;
        setScoreCount(Array.isArray(body?.scores) ? body.scores.length : 0);
      }
    } catch {
      /* The publish itself already said what happened. Leave the panel. */
    }
  }, []);

  useEffect(() => {
    document.title = "Chocolathon — Publish submissions";
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    let stored = "";
    try {
      stored = localStorage.getItem(KEY_STORAGE) ?? "";
    } catch {
      /* private window; the field starts empty */
    }
    if (stored) {
      setKey(stored);
      void loadLive(stored);
    }
    return () => tag.remove();
  }, [loadLive]);

  useEffect(() => {
    return () => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
    };
  }, []);

  /* Sends only the fields named in the patch. The server merges them
     into the stored config and returns the whole thing, which becomes
     this page's copy, so a value another page changed survives.

     Until a stored config exists there is nothing to merge into, and a
     patch would leave every other field at its empty default. So the
     first save carries the whole document `base` is holding. */
  const postConfig = useCallback(
    async (patch: Partial<JudgingConfig>, base: JudgingConfig | null): Promise<JudgingConfig | null> => {
      const body: Partial<JudgingConfig> =
        storedConfigExists || !base
          ? patch
          : {
              judges: base.judges,
              minPerTeam: base.minPerTeam,
              assignments: base.assignments,
              excluded: base.excluded,
              closed: base.closed,
              ...patch,
            };
      try {
        const r = await fetch("/api/judging-config", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-upload-key": key.trim() },
          body: JSON.stringify(body),
        });
        const j = (await r.json().catch(() => null)) as (JudgingConfig & { error?: string }) | null;
        if (!r.ok) {
          setConfigError(j?.error ?? `Could not save that (${r.status}).`);
          return null;
        }
        if (!j || !Array.isArray(j.judges)) {
          setConfigError("The server saved it but sent back something unexpected. Reload the page.");
          return null;
        }
        /* Adopt the server's copy only for the fields this POST sent, so a
           Close or Reopen never drops assignment edits the panel has not
           published yet. A first-run POST carried the whole document, so
           the whole answer is ours to adopt. */
        const sentKeys = Object.keys(body) as (keyof JudgingConfig)[];
        const touchesPanel = sentKeys.some((k) => k === "judges" || k === "minPerTeam" || k === "assignments");
        setConfig((prev) => {
          if (!prev || !storedConfigExists) return j;
          const next: JudgingConfig = { ...prev };
          for (const k of sentKeys) (next as Record<string, unknown>)[k] = (j as Record<string, unknown>)[k];
          return next;
        });
        setStoredConfigExists(true);
        if (touchesPanel || !storedConfigExists) setConfigDirty(false);
        return j;
      } catch {
        setConfigError("Could not reach the server. Check your connection and try again.");
        return null;
      }
    },
    [key, storedConfigExists],
  );

  const publishConfig = useCallback(
    async (c: JudgingConfig) => {
      setConfigBusy(true);
      setConfigError(null);
      setConfigResult(null);
      const merged = await postConfig({ judges: c.judges, minPerTeam: c.minPerTeam, assignments: c.assignments }, c);
      if (merged) setConfigResult("Assignments published. Judges see them on refresh.");
      setConfigBusy(false);
    },
    [postConfig],
  );

  /* Optimistic, because the switch should move under the finger, but it
     moves back if the server refused. */
  async function toggleClosed() {
    if (!config || configBusy) return;
    const previous = config;
    const next = !config.closed;
    setConfig({ ...config, closed: next });
    setConfigBusy(true);
    setConfigError(null);
    setConfigResult(null);
    const merged = await postConfig({ closed: next }, previous);
    if (merged) setConfigResult(next ? "Judging is closed. Judges can read, not save." : "Judging is open again.");
    else setConfig(previous);
    setConfigBusy(false);
  }

  function clearScores() {
    if (!clearArmed) {
      setClearArmed(true);
      setClearResult(null);
      clearTimer.current = window.setTimeout(() => setClearArmed(false), 5000);
      return;
    }
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    setClearArmed(false);
    void (async () => {
      try {
        const r = await fetch("/api/scores", { method: "DELETE", headers: { "x-upload-key": key.trim() } });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setClearResult(j?.error ?? `Could not clear scores (${r.status}).`);
          return;
        }
        setClearResult(`Deleted ${j.deleted} scores.`);
        setScoreCount(0);
      } catch {
        setClearResult("Could not reach the server. Check your connection and try again.");
      }
    })();
  }

  const readFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setPublishArmed(false);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
      if (rows.length < 2) {
        setError("That file has a header row but no responses.");
        setParsed(null);
        return;
      }
      const [header, ...data] = rows;
      const { judging, missing, dropped, warnings, optionalMissing } = mapRows(
        header.map(String),
        data.map((r) => r.map(String)),
        file.name,
      );
      setParsed({ judging, missing, headers: header.map(String), dropped, warnings, optionalMissing });
    } catch {
      setError("Could not read that file. It should be the Excel workbook from Forms, or a CSV.");
      setParsed(null);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void readFile(f);
    },
    [readFile],
  );

  async function publish() {
    if (!parsed || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      localStorage.setItem(KEY_STORAGE, key);
    } catch {
      /* fine */
    }
    try {
      const r = await fetch("/api/judging", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-upload-key": key.trim() },
        body: JSON.stringify(parsed.judging),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j?.error ?? `Publish failed (${r.status}).`);
      } else {
        setResult(`Published ${j.count} submissions. Judges refresh and they are there.`);
        setPublishArmed(false);
        void refreshLiveSet(key);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const build = parsed?.judging.submissions.filter((s) => s.track === "build") ?? [];
  const pitch = parsed?.judging.submissions.filter((s) => s.track === "pitch") ?? [];
  const canPublish = !!parsed && parsed.missing.length === 0 && key.trim().length > 0 && !busy;

  /* Teams the judges can see now that this file does not contain. Their
     scores are keyed by teamKey, so publishing without them leaves those
     scores attached to a team nobody can open. */
  const orphans = useMemo(() => {
    if (!parsed || !liveJudging) return [] as string[];
    const incoming = new Set(parsed.judging.submissions.map((s) => s.teamKey));
    for (const d of parsed.dropped) incoming.add(d.teamKey);
    return liveJudging.submissions
      .filter((s) => !s.duplicateOf && !incoming.has(s.teamKey))
      .map((s) => s.team || s.teamKey);
  }, [parsed, liveJudging]);
  const orphansMatter = orphans.length > 0 && scoreCount > 0;

  useEffect(() => {
    if (!orphansMatter) setPublishArmed(false);
  }, [orphansMatter]);

  function onPublishClick() {
    if (!canPublish) return;
    if (orphansMatter && !publishArmed) {
      setPublishArmed(true);
      return;
    }
    void publish();
  }

  /* What the page says when nothing is loaded. Shown under the key field
     and again where the panel would be, so neither place can claim
     something is ready to edit. */
  const waitingLine =
    liveStatus === "needs-key"
      ? "Enter the upload key and press Enter to load the live set."
      : liveStatus === "denied"
        ? "That upload key is not right."
        : liveStatus === "error"
          ? (loadError ?? "Could not reach the server. Check your connection and try again.")
          : "Loading…";

  return (
    <div className="choco-root min-h-screen bg-white">
      <main className="mx-auto max-w-3xl px-5 pb-32 pt-16 sm:px-8">
        <p className="label label-strong">Chocolathon · Publish submissions</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          Drop the export here.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
          At 2:00: in Forms, Responses, "Open in Excel". Drag that workbook onto the box
          below, check the preview, publish. The judge page updates on refresh.
        </p>

        <div className="mt-8 flex max-w-md flex-wrap items-end gap-3">
          <label className="min-w-[12rem] flex-1">
            <span className="label">Upload key</span>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void loadLive(key);
                }
              }}
              onBlur={() => {
                if (key.trim() !== loadedKey.current) void loadLive(key);
              }}
              autoComplete="off"
              className="mt-2 w-full border-0 border-b-2 border-ink/20 bg-transparent px-0 py-2 text-base text-ink outline-none focus:border-gold"
            />
          </label>
          <button type="button" onClick={() => void loadLive(key)} className="btn-ghost-sm">
            Load
          </button>
        </div>

        {liveStatus === "error" ? (
          <p role="alert" className="mt-6 border-l-2 border-gold pl-4 text-base text-ink">
            {waitingLine}
          </p>
        ) : (
          <p className="label mt-6">
            {liveStatus === "needs-key"
              ? "Enter the upload key and press Enter to load the live set."
              : liveStatus === "loading"
                ? "Loading the live set…"
                : liveStatus === "denied"
                  ? "That upload key is not right."
                  : live
                    ? `Judges currently see ${live.count} submissions` +
                      (live.publishedAt
                        ? `, published ${new Date(live.publishedAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "America/Chicago",
                          })}`
                        : "")
                    : "Judges currently see nothing published"}
          </p>
        )}

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={
            "mt-8 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 text-center transition-colors " +
            (dragging ? "border-ink bg-ink/[0.04]" : "border-ink/30 hover:border-ink/60")
          }
        >
          <span className="font-display text-2xl font-semibold text-ink">
            {parsed ? parsed.judging.source : "Drag the Excel file here"}
          </span>
          <span className="mt-2 text-base text-ink/80">or click to choose a file · .xlsx or .csv</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
            }}
          />
        </label>

        {error ? (
          <p role="alert" className="mt-6 border-l-2 border-gold pl-4 text-base text-ink">
            {error}
          </p>
        ) : null}

        {parsed ? (
          <section className="mt-10 border-t border-ink/15 pt-8">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {parsed.judging.count} submissions
            </h2>
            <p className="label mt-2">
              {build.length} Build · {pitch.length} Pitch
              {parsed.judging.sample ? " · sample file" : ""}
            </p>

            {parsed.missing.length ? (
              <p role="alert" className="mt-5 border-l-2 border-gold pl-4 text-base text-ink">
                Could not find a column for: {parsed.missing.join(", ")}. The headers in the file
                are: {parsed.headers.join(" | ")}
              </p>
            ) : null}

            {parsed.dropped.length ? (
              <ul className="mt-5 space-y-1 border-l-2 border-gold pl-4 text-base text-ink">
                {parsed.dropped.map((d) => (
                  <li key={`${d.team}-${d.n}`}>{d.duplicateReason}</li>
                ))}
              </ul>
            ) : null}

            {parsed.warnings.length ? (
              <ul className="mt-5 space-y-1 text-base text-amber-700">
                {parsed.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}

            {orphans.length ? (
              <div
                className={
                  "mt-5 border-l-2 pl-4 text-base " +
                  (orphansMatter ? "border-amber-500 text-amber-700" : "border-ink/20 text-ink/70")
                }
              >
                <p>
                  These teams are in the live set but not in this file: {orphans.join(", ")}.
                  {orphansMatter ? " Their scores and assignments would be orphaned." : ""}
                </p>
                {publishArmed ? <p className="mt-1">Click Publish anyway to go ahead.</p> : null}
              </div>
            ) : null}

            {parsed.optionalMissing.length ? (
              <p className="mt-5 text-sm text-ink/50">
                Not found in this export: {parsed.optionalMissing.join(", ")}.
              </p>
            ) : null}

            <ol className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
              {parsed.judging.submissions.map((s) => (
                <li key={s.n} className="grid gap-1 py-3 sm:grid-cols-[3rem_1fr] sm:gap-4">
                  <span className="label">{s.track === "build" ? "Build" : "Pitch"}</span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-ink">
                      {s.team || <em className="font-normal text-ink/80">no team name</em>}
                      {s.prompt ? <span className="label ml-3">{s.prompt}</span> : null}
                    </span>
                    <span className="block truncate text-sm text-ink/80">
                      {s.sentence || s.product}
                    </span>
                    {!s.product || !s.video ? (
                      <span className="label label-accent block">missing a link</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
              <button
                type="button"
                onClick={onPublishClick}
                disabled={!canPublish}
                className="btn-cta disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Publishing…" : publishArmed ? "Publish anyway" : "Publish to the judges"}
              </button>
              {key.trim() ? null : <span className="label">Enter the upload key above first.</span>}
            </div>

            {result ? (
              <p className="mt-6 border-l-2 border-gold pl-4 text-base text-ink">
                {result}{" "}
                <a href={JUDGE_PATH} target="_blank" rel="noopener noreferrer" className="underline decoration-gold underline-offset-4">
                  Open the judge page
                </a>
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-12 border-t border-ink/15 pt-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Assign the judges.
          </h2>
          <p className="mt-3 max-w-xl text-base text-ink/80">
            This reads the submissions judges currently see, not the file above. Publish
            the file first if it has not gone out yet.
          </p>

          {config ? (
            <AssignmentPanel
              judging={liveJudging}
              config={config}
              scoreCount={scoreCount}
              dirty={configDirty}
              onChange={(c) => {
                setConfig(c);
                setConfigDirty(true);
              }}
              publish={publishConfig}
              busy={configBusy}
            />
          ) : (
            <p
              className={
                liveStatus === "error" ? "mt-6 border-l-2 border-gold pl-4 text-base text-ink" : "label mt-6"
              }
            >
              {waitingLine}
            </p>
          )}

          {configError ? (
            <p role="alert" className="mt-6 border-l-2 border-gold pl-4 text-base text-ink">
              {configError}
            </p>
          ) : null}
          {configResult ? (
            <p className="mt-6 border-l-2 border-gold pl-4 text-base text-ink">{configResult}</p>
          ) : null}
        </section>

        <section className="mt-12 border-t border-ink/15 pt-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Close judging.
          </h2>
          <button
            type="button"
            onClick={() => void toggleClosed()}
            disabled={!config || configBusy}
            className="btn-ghost mt-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {config?.closed ? "Reopen judging" : "Close judging"}
          </button>
          <p className="label mt-3">
            Closed: judges can read, not save. Export from the ranking page.
          </p>
        </section>

        <section className="mt-12 border-t border-ink/15 pb-8 pt-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Clear all scores.
          </h2>
          <button
            type="button"
            onClick={clearScores}
            disabled={!config}
            className="btn-ghost mt-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {clearArmed ? `Click again to delete ${scoreCount} scores` : "Clear every score"}
          </button>
          <p className="label mt-3">Only for rehearsal. This deletes every saved score.</p>
          {clearResult ? <p className="mt-3 text-base text-ink">{clearResult}</p> : null}
        </section>
      </main>
    </div>
  );
}
