/* ═══════════════════════════════════════════════════════════════════
   useScores — the judge page's one promise: a score is never lost.

   Every Save writes a draft to localStorage FIRST, then POSTs. A 200
   clears the draft and keeps the server's copy. A network failure or a
   5xx keeps the draft, paints the card amber, and retries every ten
   seconds until it lands. A refusal the server means (400 validation,
   401 wrong token, 423 judging closed) stops retrying and shows the
   server's own sentence, but still keeps the draft, so nothing a judge
   typed disappears because a request came back.

   On load the drafts for this judge are merged over what the server
   has (newer savedAt wins) and each one is retried at once, so a judge
   whose phone dropped off the wifi mid-round sees their work reappear
   and land the moment they are back.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";

import type { Score } from "../judging/types";

export const draftKey = (judgeId: string, teamKey: string) => `choco-draft:${judgeId}:${teamKey}`;

export function mergeScores(server: Score[], drafts: Score[]): Record<string, Score> {
  const out: Record<string, Score> = {};
  for (const s of server) out[s.teamKey] = s;
  for (const d of drafts) {
    const cur = out[d.teamKey];
    if (!cur || d.savedAt > cur.savedAt) out[d.teamKey] = d;
  }
  return out;
}

export const shouldRetry = (status: number | null) =>
  status === null || status === 0 || status >= 500 || status === 408 || status === 429;

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "retrying"; message: string }
  | { kind: "refused"; message: string };

const RETRY_MS = 10_000;
const RETRY_LINE = "Not saved. Kept on this device, retrying…";

/* localStorage throws in a locked-down browser; a judge with cookies
   blocked still gets a working page, just without the safety net. */
function readDrafts(judgeId: string): Score[] {
  const prefix = draftKey(judgeId, "");
  const out: Score[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Score;
      if (parsed && typeof parsed.teamKey === "string" && typeof parsed.savedAt === "string") out.push(parsed);
    }
  } catch {
    return out;
  }
  return out;
}

function writeDraft(score: Score): void {
  try {
    localStorage.setItem(draftKey(score.judgeId, score.teamKey), JSON.stringify(score));
  } catch {
    /* Nothing to do: the POST below is still the real save. */
  }
}

function clearDraft(judgeId: string, teamKey: string): void {
  try {
    localStorage.removeItem(draftKey(judgeId, teamKey));
  } catch {
    /* ignore */
  }
}

export function useScores(judgeId: string | null, token: string | null) {
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [states, setStates] = useState<Record<string, SaveState>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const timers = useRef<Record<string, number>>({});
  /* The retry interval closes over the score it is retrying but must
     always call the CURRENT attempt, so the token/judge it captured can
     never go stale. */
  const attemptRef = useRef<(score: Score) => Promise<void>>();

  const stopTimer = useCallback((teamKey: string) => {
    const t = timers.current[teamKey];
    if (t) {
      window.clearInterval(t);
      delete timers.current[teamKey];
    }
  }, []);

  const attempt = useCallback(
    async (score: Score) => {
      if (!token) return;
      setStates((prev) => ({ ...prev, [score.teamKey]: { kind: "saving" } }));

      let status: number | null = null;
      let payload: { score?: Score; error?: string } | null = null;
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "x-judge-key": token },
          body: JSON.stringify(score),
        });
        status = res.status;
        try {
          payload = (await res.json()) as { score?: Score; error?: string };
        } catch {
          payload = null;
        }
      } catch {
        status = null;
      }

      if (status === 200) {
        const saved = payload?.score ?? score;
        clearDraft(score.judgeId, score.teamKey);
        stopTimer(score.teamKey);
        setScores((prev) => ({ ...prev, [saved.teamKey]: saved }));
        setStates((prev) => ({ ...prev, [saved.teamKey]: { kind: "saved", at: saved.savedAt } }));
        return;
      }

      if (shouldRetry(status)) {
        setStates((prev) => ({ ...prev, [score.teamKey]: { kind: "retrying", message: RETRY_LINE } }));
        if (!timers.current[score.teamKey]) {
          timers.current[score.teamKey] = window.setInterval(() => {
            void attemptRef.current?.(score);
          }, RETRY_MS);
        }
        return;
      }

      /* A refusal the server meant. Stop retrying, say what it said, and
         keep the draft: the judge can fix it and save again. */
      stopTimer(score.teamKey);
      if (status === 401) setUnauthorized(true);
      setStates((prev) => ({
        ...prev,
        [score.teamKey]: { kind: "refused", message: payload?.error ?? "The server refused this score. Tell Michael." },
      }));
    },
    [stopTimer, token],
  );

  attemptRef.current = attempt;

  /* Load once per judge. Drafts win over the server when they are newer,
     and every draft is retried the moment the page opens. */
  useEffect(() => {
    setScores({});
    setStates({});
    setLoadError(null);
    if (!judgeId || !token) return;

    let cancelled = false;
    (async () => {
      const drafts = readDrafts(judgeId);
      let server: Score[] = [];
      try {
        const res = await fetch(`/api/scores?judge=${encodeURIComponent(judgeId)}`, {
          cache: "no-store",
          headers: { "x-judge-key": token },
        });
        if (res.status === 401) {
          if (!cancelled) setUnauthorized(true);
        } else if (res.ok) {
          const body = (await res.json()) as { scores?: Score[] };
          server = Array.isArray(body.scores) ? body.scores : [];
        } else if (!cancelled) {
          setLoadError("Could not read your saved scores. Anything you save now is kept on this device and sent again.");
        }
      } catch {
        if (!cancelled) setLoadError("Could not reach the server. Anything you save now is kept on this device and sent again.");
      }
      if (cancelled) return;

      setScores(mergeScores(server, drafts));
      if (drafts.length) {
        setStates(Object.fromEntries(drafts.map((d) => [d.teamKey, { kind: "retrying", message: RETRY_LINE } as SaveState])));
        for (const d of drafts) void attemptRef.current?.(d);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [judgeId, token]);

  /* Timers outlive a card unmount on purpose (a judge scrolling away
     must not stop a retry), but never the page. */
  useEffect(
    () => () => {
      for (const key of Object.keys(timers.current)) window.clearInterval(timers.current[key]);
      timers.current = {};
    },
    [],
  );

  const save = useCallback(
    (input: Omit<Score, "savedAt">) => {
      const score: Score = { ...input, savedAt: new Date().toISOString() };
      writeDraft(score);
      /* Optimistic: the queue shows the total straight away and paints it
         amber until the server confirms. */
      setScores((prev) => ({ ...prev, [score.teamKey]: score }));
      void attempt(score);
    },
    [attempt],
  );

  return { scores, states, loadError, unauthorized, save };
}
