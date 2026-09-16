/* ═══════════════════════════════════════════════════════════════════
   UPLOAD PAGE — drop the form export, publish it to the judges.

   For Michael at 2:00 on September 19. Drag the Excel workbook (or a
   CSV) that Microsoft Forms produced onto this page. It is parsed in the
   browser, the columns are matched the same way the command-line script
   matches them, a preview shows what the judges would see, and Publish
   sends it to /api/judging with the upload key. Nothing else on the site
   changes; the judge page reads the new set on refresh.

   ── The state machine ──────────────────────────────────────────────

   liveStatus is the one answer to "is what this page is showing worth
   acting on", and every other rule here reads from it:

     needs-key  no key in the field. Nothing goes out.
     loading    a load is in flight.
     ready      the last load succeeded. The only state that publishes.
     denied     the key was refused (401).
     error      a load failed and there was never a good one to keep.
     stale      a load failed and the last good one is still on screen.

   ready → stale, never ready → nothing, is the whole of the third fix:
   a reload that fails keeps the live set and the score count it already
   had, so the orphan warning still knows which teams would lose their
   scores. It blocks Publish instead (the button says so), because
   publishing against a set this page could not re-read is the thing
   that would actually hurt.

   Nothing on this page is ever thrown away by a failure. The local
   config is replaced in exactly three places: a load that succeeded
   while the panel was clean, a save that came back 200, and Discard my
   edits. A load that succeeds while the panel is dirty keeps the panel
   and adopts the server's answer for everything else, and says so.

   ── What the config writes send ────────────────────────────────────

   Every write sends only the fields this page owns, so publishing
   assignments can no longer revert the close switch or the exclusions
   the ranking page made a minute earlier. The one exception is the
   first save of a run that found no stored config: that one carries the
   whole document, because a patch would merge into an empty default.
   Before it does, it re-reads /api/judging-config, because "there is no
   config" can be twenty minutes old — if another tab created one in the
   meantime, the whole document would overwrite it, and this becomes a
   patch after all.

   A first run also refuses to seed itself from a hub that did not
   answer, or from a hub with nobody in it: judges: [] saved over the
   real list is the whole panel gone, and the server now refuses that
   body too.
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
const UNREACHABLE = "Could not reach the server. Nothing here is editable until it loads.";

type Parsed = {
  judging: Judging;
  missing: string[];
  headers: string[];
  dropped: Submission[];
  warnings: string[];
  optionalMissing: string[];
};

type LiveStatus = "needs-key" | "loading" | "ready" | "denied" | "error" | "stale";

/* The three fields the assignment panel owns. Everything else in a
   config (closed, excluded) belongs to the ranking page, and this page
   always takes the server's word for those. */
const PANEL_KEYS = ["judges", "minPerTeam", "assignments"] as const;
type PanelKey = (typeof PANEL_KEYS)[number];

/* What one read of the live set answers. "empty" is a 404: nothing is
   published yet, which is a state, not a failure. */
type LiveSet = {
  judging: Judging | null;
  scoreCount: number;
  status: "ready" | "empty" | "denied" | "error";
  message?: string;
};

/* The server's document wins for every field except the ones this tab
   has edited and not published yet. */
function withLocalEdits(prev: JudgingConfig, server: JudgingConfig, keep: readonly PanelKey[]): JudgingConfig {
  const next: JudgingConfig = { ...server };
  for (const k of keep) (next as Record<string, unknown>)[k] = prev[k];
  return next;
}

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
     when nothing was typed. */
  const loadedKey = useRef<string | null>(null);
  /* A load has succeeded at least once, so there is a last good set on
     screen that a later failure must keep rather than erase. */
  const loadedOnce = useRef(false);

  /* The stored document as this page last saw it, from a GET or from the
     answer to a POST. null means no config has ever been saved, which is
     what makes a save a whole-document write instead of a patch. */
  const storedRef = useRef<JudgingConfig | null>(null);
  /* The document a first run seeded from the hub, so Discard has
     something to go back to before anything has ever been saved. */
  const seedRef = useRef<JudgingConfig | null>(null);
  /* Which panel fields this tab has changed and not published, and when.
     configDirty is this map's size, mirrored into state for rendering. */
  const editsRef = useRef(new Map<PanelKey, number>());
  const editSeqRef = useRef(0);

  const markEdits = useCallback((keys: readonly PanelKey[]) => {
    for (const k of keys) editsRef.current.set(k, ++editSeqRef.current);
    setConfigDirty(editsRef.current.size > 0);
  }, []);

  const clearEdits = useCallback((keys?: readonly PanelKey[]) => {
    if (keys) for (const k of keys) editsRef.current.delete(k);
    else editsRef.current.clear();
    setConfigDirty(editsRef.current.size > 0);
  }, []);

  /* Fold a server document into this page. `sent` is what the request
     that produced it carried and `mark` is the edit counter as that
     request left: a field this tab edited after that is still this
     tab's, a field the request published is the server's again. A load
     passes sent: [] — it published nothing, so every live edit stays. */
  const settle = useCallback(
    (server: JudgingConfig, sent: readonly (keyof JudgingConfig)[], mark: number) => {
      const keep: PanelKey[] = [];
      const published: PanelKey[] = [];
      for (const [k, at] of editsRef.current) {
        if (at <= mark && (sent as readonly string[]).includes(k)) published.push(k);
        else keep.push(k);
      }
      setConfig((prev) => (prev ? withLocalEdits(prev, server, keep) : server));
      if (published.length) clearEdits(published);
    },
    [clearEdits],
  );

  /* A load failed. Keep whatever was already good and say so; only a
     page that never had a good set has nothing to show. */
  const failLoad = useCallback((message: string) => {
    setLoadError(message);
    setLiveStatus(loadedOnce.current ? "stale" : "error");
  }, []);

  /* The published set and the saved score count, read once, by both
     callers: the full load behind the key field and the refresh that
     follows a file publish. Returns null when a newer request has
     already started, so the caller drops this answer on the floor. */
  const fetchLiveSet = useCallback(async (k: string, seq: number): Promise<LiveSet | null> => {
    const stale = () => seq !== seqRef.current;
    const failed = (what: string, status: number): LiveSet => ({
      judging: null,
      scoreCount: 0,
      status: "error",
      message: `Could not load the ${what} (${status}). Nothing here is editable until it loads.`,
    });
    try {
      const withKey = { cache: "no-store" as const, headers: { "x-upload-key": k } };
      const [jRes, sRes] = await Promise.all([
        fetch("/api/judging", withKey),
        fetch("/api/scores?all=1", withKey),
      ]);
      if (stale()) return null;
      if (jRes.status === 401 || sRes.status === 401) return { judging: null, scoreCount: 0, status: "denied" };

      /* A 404 is the quiet state before anything is published. Anything
         else is a server that did not answer, and this page must not
         invent a set to stand in for what it could not read. */
      if (!jRes.ok && jRes.status !== 404) return failed("published submissions", jRes.status);
      if (!sRes.ok && sRes.status !== 404) return failed("saved scores", sRes.status);

      const judging = jRes.ok ? ((await jRes.json().catch(() => null)) as Judging | null) : null;
      if (stale()) return null;
      if (jRes.ok && (!judging || !Array.isArray(judging.submissions))) {
        return failed("published submissions", jRes.status);
      }

      let scoreCount = 0;
      if (sRes.ok) {
        const body = (await sRes.json().catch(() => null)) as { scores?: unknown[] } | null;
        if (stale()) return null;
        scoreCount = Array.isArray(body?.scores) ? (body?.scores as unknown[]).length : 0;
      }
      return { judging, scoreCount, status: judging ? "ready" : "empty" };
    } catch {
      if (stale()) return null;
      return { judging: null, scoreCount: 0, status: "error", message: UNREACHABLE };
    }
  }, []);

  /* One load for everything behind the key: the published set, the score
     count, the config, and the public judge list that seeds a first run.
     None of it goes out before the key field has content, because
     /api/judging and /api/judging-config refuse a request without one. */
  const loadLive = useCallback(
    async (raw: string) => {
      const k = raw.trim();
      const seq = ++seqRef.current;
      const stale = () => seq !== seqRef.current;
      loadedKey.current = k;

      if (!k) {
        setLiveStatus("needs-key");
        setLoadError(null);
        return;
      }
      setLiveStatus("loading");
      setLoadError(null);

      const withKey = { cache: "no-store" as const, headers: { "x-upload-key": k } };
      const [set, cRes, hubRes] = await Promise.all([
        fetchLiveSet(k, seq),
        fetch("/api/judging-config", withKey).then(
          (r) => r,
          () => null,
        ),
        fetch("/api/hub", { cache: "no-store" }).then(
          (r) => r,
          () => null,
        ),
      ]);
      if (stale() || !set) return;

      if (set.status === "denied" || cRes?.status === 401) {
        setLoadError(null);
        setLiveStatus("denied");
        return;
      }
      if (set.status === "error") return failLoad(set.message ?? UNREACHABLE);
      if (!cRes) return failLoad(UNREACHABLE);
      const configRefused = `Could not load the judging config (${cRes.status}). Nothing here is editable until it loads.`;
      if (!cRes.ok && cRes.status !== 404) return failLoad(configRefused);

      const storedConfig = cRes.ok ? ((await cRes.json().catch(() => null)) as JudgingConfig | null) : null;
      if (stale()) return;
      if (cRes.ok && (!storedConfig || !Array.isArray(storedConfig.judges))) return failLoad(configRefused);

      let next = storedConfig;
      if (!next) {
        /* First run, and a real 404 proved it: no config yet, so seed the
           judges from the public hub with every one of them switched off.
           A hub that refused, or a hub with nobody in it, is a failed
           load and not an empty roster. */
        const hub = hubRes?.ok ? ((await hubRes.json().catch(() => null)) as HubData | null) : null;
        if (stale()) return;
        const people = hub?.people?.preliminary ?? [];
        if (!people.length) {
          return failLoad(
            `Could not load the judge list from /api/hub (${hubRes?.status ?? 0}). Nothing here is editable until it loads.`,
          );
        }
        const judges: Judge[] = people.map((p) => ({ id: judgeId(p.name), name: p.name, tracks: "off" }));
        next = { judges, minPerTeam: 2, assignments: {}, excluded: [], closed: false };
        seedRef.current = next;
      }

      storedRef.current = storedConfig;
      setLive(set.judging ? { count: set.judging.count, publishedAt: set.judging.publishedAt } : null);
      setLiveJudging(set.judging);
      setScoreCount(set.scoreCount);

      /* Unpublished panel edits outrank the stored document. The load
         still refreshed the live set, the score count, and every field
         the panel does not own. */
      const kept = editsRef.current.size > 0;
      settle(next, [], editSeqRef.current);
      setConfigResult(kept ? "Kept your unpublished assignment edits." : null);

      setLoadError(null);
      loadedOnce.current = true;
      setLiveStatus("ready");
      try {
        localStorage.setItem(KEY_STORAGE, k);
      } catch {
        /* private window; he types it again next time */
      }
    },
    [fetchLiveSet, failLoad, settle],
  );

  /* What a finished file publish needs: the new live set and the score
     count, and nothing else. It never touches the config, or publishing
     the file would revert whatever is half-edited in the panel. */
  const refreshLiveSet = useCallback(
    async (raw: string) => {
      const k = raw.trim();
      if (!k) return;
      const seq = ++seqRef.current;
      const set = await fetchLiveSet(k, seq);
      if (!set) return;
      if (set.status === "denied") {
        setLoadError(null);
        setLiveStatus("denied");
        return;
      }
      if (set.status === "error") return failLoad(set.message ?? UNREACHABLE);
      setLive(set.judging ? { count: set.judging.count, publishedAt: set.judging.publishedAt } : null);
      setLiveJudging(set.judging);
      setScoreCount(set.scoreCount);
      setLoadError(null);
      loadedOnce.current = true;
      setLiveStatus("ready");
    },
    [fetchLiveSet, failLoad],
  );

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
     into the stored config and returns the whole thing, and this page
     adopts that answer for everything except what it has edited since
     the request left.

     Until a stored config exists there is nothing to merge into, so the
     first save carries the whole document `base` is holding — after one
     more GET, because another tab may have published one while this one
     sat on a twenty-minute-old 404. */
  const postConfig = useCallback(
    async (patch: Partial<JudgingConfig>, base: JudgingConfig): Promise<JudgingConfig | null> => {
      const k = key.trim();
      const mark = editSeqRef.current;

      if (!storedRef.current) {
        let check: Response | null = null;
        try {
          check = await fetch("/api/judging-config", { cache: "no-store", headers: { "x-upload-key": k } });
        } catch {
          check = null;
        }
        if (!check) {
          setConfigError("Could not reach the server. Check your connection and try again.");
          return null;
        }
        if (check.status === 401) {
          setConfigError("That upload key is not right.");
          return null;
        }
        if (check.ok) {
          const found = (await check.json().catch(() => null)) as JudgingConfig | null;
          if (found && Array.isArray(found.judges)) {
            /* It exists after all. This is a patch, and the fields this
               tab has not edited are the other tab's now. */
            storedRef.current = found;
            settle(found, [], mark);
          }
        } else if (check.status !== 404) {
          setConfigError(`Could not read the stored config (${check.status}). Try again.`);
          return null;
        }
      }

      const stored = storedRef.current;
      const body: Partial<JudgingConfig> = stored
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
          headers: { "Content-Type": "application/json", "x-upload-key": k },
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
        storedRef.current = j;
        settle(j, Object.keys(body) as (keyof JudgingConfig)[], mark);
        return j;
      } catch {
        setConfigError("Could not reach the server. Check your connection and try again.");
        return null;
      }
    },
    [key, settle],
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
     moves back if the server refused — the closed field, and only that
     field, so a rollback cannot take assignment edits with it. */
  async function toggleClosed() {
    if (!config || configBusy) return;
    /* On a first run this write carries the whole document, assignments
       and all. Half-dealt assignments are not something to publish by
       pressing Close, and Michael would not close before assigning. */
    if (!storedRef.current && editsRef.current.size > 0) {
      setConfigResult(null);
      setConfigError("Publish the assignments first, then close.");
      return;
    }
    const wasClosed = config.closed;
    const next = !config.closed;
    setConfig({ ...config, closed: next });
    setConfigBusy(true);
    setConfigError(null);
    setConfigResult(null);
    const merged = await postConfig(
      { closed: next },
      { ...config, assignments: {}, excluded: [], closed: next },
    );
    if (merged) setConfigResult(next ? "Judging is closed. Judges can read, not save." : "Judging is open again.");
    else setConfig((prev) => (prev ? { ...prev, closed: wasClosed } : prev));
    setConfigBusy(false);
  }

  function discardEdits() {
    const base = storedRef.current ?? seedRef.current;
    if (!base || configBusy) return;
    setConfig(base);
    clearEdits();
    setConfigError(null);
    setConfigResult("Discarded your unpublished edits.");
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
  /* Only a set this page has actually re-read can be published over. A
     stale one still shows, and still warns about orphans, but the write
     waits for a load that worked. */
  const canPublish = !!parsed && parsed.missing.length === 0 && liveStatus === "ready" && !busy;

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

  const publishLabel = busy
    ? "Publishing…"
    : liveStatus === "needs-key"
      ? "Enter the upload key first"
      : liveStatus === "loading"
        ? "Loading the live set…"
        : liveStatus !== "ready"
          ? "Reload the live set first"
          : publishArmed
            ? "Publish anyway"
            : "Publish to the judges";

  /* What the page says when nothing loaded. Shown under the key field and
     again where the panel would be, so neither place can claim something
     is ready to edit. */
  const waitingLine =
    liveStatus === "needs-key"
      ? "Enter the upload key and press Enter to load the live set."
      : liveStatus === "denied"
        ? "That upload key is not right."
        : liveStatus === "error" || liveStatus === "stale"
          ? (loadError ?? UNREACHABLE)
          : "Loading…";
  const loadFailed = liveStatus === "error" || liveStatus === "stale";

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

        {loadFailed ? (
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
                {publishLabel}
              </button>
              {liveStatus === "ready" ? null : <span className="label">{waitingLine}</span>}
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
                const changed = PANEL_KEYS.filter((k) => !config || c[k] !== config[k]);
                if (changed.length) markEdits(changed);
                setConfig(c);
              }}
              onDiscard={discardEdits}
              publish={publishConfig}
              busy={configBusy}
            />
          ) : (
            <p className={loadFailed ? "mt-6 border-l-2 border-gold pl-4 text-base text-ink" : "label mt-6"}>
              {waitingLine}
            </p>
          )}

          {config && loadFailed ? <p className="label mt-6">{waitingLine}</p> : null}

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
