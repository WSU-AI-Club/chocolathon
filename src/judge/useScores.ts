/* ═══════════════════════════════════════════════════════════════════
   useScores — the judge page's one promise: a score is never lost.

   Every Save stamps the judge's own clock (clientSavedAt), writes a
   draft to localStorage FIRST, puts the score in `pending`, then POSTs.
   A 200 clears the draft and keeps the server's copy. A network failure
   or a 5xx keeps the draft, paints the card amber, and retries every ten
   seconds until it lands. A refusal the server means (400 validation,
   401 wrong token, 423 judging closed) stops retrying and shows the
   server's own sentence, but still keeps the draft, so nothing a judge
   typed disappears because a request came back.

   `pending` holds ONE score per team: the latest. The retry timer reads
   it at fire time rather than closing over the score that first failed,
   so a judge who corrects a card while the wifi is out sends the
   correction, not the version they threw away. A 200 is only the end of
   the story when the acknowledged payload is the one still pending
   (nextPending); otherwise the newer one is posted at once and the
   draft stays put. That sequence — save v1 offline, save v2 offline,
   network back — is the test at the bottom of useScores.test.ts.

   On load the drafts for this judge are merged over what the server has
   (newer clientSavedAt wins) and each one is retried at once, so a judge
   whose phone dropped off the wifi mid-round sees their work reappear
   and land the moment they are back.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";

import type { Score } from "../judging/types";

export const draftKey = (judgeId: string, teamKey: string) => `choco-draft:${judgeId}:${teamKey}`;

/* What a Save is, before the two timestamps this file owns. */
export type SaveInput = Omit<Score, "savedAt" | "clientSavedAt">;

/* The judge's clock if it is there, the server's if it is not. Scores
   saved before clientSavedAt existed still have to sort somewhere, and
   sorting them by the only stamp they have beats treating a judge's
   unsent draft as older than everything. */
export const stampOf = (score: Pick<Score, "clientSavedAt" | "savedAt">): string =>
  score.clientSavedAt || score.savedAt || "";

const at = (score: Pick<Score, "clientSavedAt" | "savedAt">): number => {
  const t = Date.parse(stampOf(score));
  return Number.isNaN(t) ? 0 : t;
};

export function mergeScores(server: Score[], drafts: Score[]): Record<string, Score> {
  const out: Record<string, Score> = {};
  for (const s of server) out[s.teamKey] = s;
  for (const d of drafts) {
    const cur = out[d.teamKey];
    if (!cur || at(d) > at(cur)) out[d.teamKey] = d;
  }
  return out;
}

/* After a 200: what still has to be posted, or null when this save is
   finished and the draft can go. `acked` is what the server said it now
   holds — our own payload, or a newer one from another device that beat
   us (the stale answer). Either way, only a pending save that is newer
   than what the server holds is still owed.

   A server that does not echo clientSavedAt is an older deploy mid
   rollout; treat its 200 as an acknowledgement rather than posting for
   ever against a field it will never return. */
export function nextPending(pending: Score | undefined | null, acked: Score | undefined | null): Score | null {
  if (!pending) return null;
  if (!acked) return pending;
  if (!acked.clientSavedAt) return null;
  return at(acked) >= at(pending) ? null : pending;
}

/* 409 is "nothing published yet": a judge who opens the page before
   Michael publishes should keep retrying, because it resolves by itself
   the moment he does. 400, 401 and 423 are decisions, not weather. */
export const shouldRetry = (status: number | null) =>
  status === null || status === 0 || status >= 500 || status === 408 || status === 409 || status === 429;

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
      if (!parsed || typeof parsed.teamKey !== "string" || typeof parsed.savedAt !== "string") continue;
      /* A draft from the build before this field existed still has to
         carry one to the server, which decides the race on it. */
      out.push(parsed.clientSavedAt ? parsed : { ...parsed, clientSavedAt: parsed.savedAt });
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
  /* One entry per team: the latest save that has not been acknowledged.
     Everything else in this file reads it at the moment it acts. */
  const pending = useRef<Record<string, Score>>({});
  const inFlight = useRef<Record<string, boolean>>({});
  const lastStamp = useRef<Record<string, string>>({});
  /* The retry interval carries only a team key, so the attempt it calls
     is always the current one and the score it posts is always the
     latest. */
  const attemptRef = useRef<(teamKey: string) => Promise<void>>();

  const stopTimer = useCallback((teamKey: string) => {
    const t = timers.current[teamKey];
    if (t) {
      window.clearInterval(t);
      delete timers.current[teamKey];
    }
  }, []);

  /* Two saves inside the same millisecond would tie, and a tie is a coin
     toss the judge did not ask for. Stamps only ever move forward. */
  const stampFor = useCallback((teamKey: string) => {
    let iso = new Date().toISOString();
    const prev = lastStamp.current[teamKey];
    if (prev && Date.parse(iso) <= Date.parse(prev)) iso = new Date(Date.parse(prev) + 1).toISOString();
    lastStamp.current[teamKey] = iso;
    return iso;
  }, []);

  const attempt = useCallback(
    async (teamKey: string) => {
      if (!token) return;
      const score = pending.current[teamKey];
      if (!score) {
        stopTimer(teamKey);
        return;
      }
      /* One request per team at a time. A save made while this one is in
         the air is in pending already and goes out on the 200. */
      if (inFlight.current[teamKey]) return;
      inFlight.current[teamKey] = true;
      setStates((prev) => ({ ...prev, [teamKey]: { kind: "saving" } }));

      let status: number | null = null;
      let payload: { score?: Score; error?: string; stale?: boolean } | null = null;
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "x-judge-key": token },
          body: JSON.stringify(score),
        });
        status = res.status;
        try {
          payload = (await res.json()) as { score?: Score; error?: string; stale?: boolean };
        } catch {
          payload = null;
        }
      } catch {
        status = null;
      } finally {
        inFlight.current[teamKey] = false;
      }

      if (status === 200) {
        /* What the server now holds: our payload, or (stale) the newer
           one another device saved. */
        const acked = payload?.score ?? score;
        const next = nextPending(pending.current[teamKey], acked);
        if (next) {
          /* A correction was typed while this was in the air. The draft
             and the timer both stay; post the newer one now. */
          setScores((prev) => ({ ...prev, [teamKey]: next }));
          void attemptRef.current?.(teamKey);
          return;
        }
        delete pending.current[teamKey];
        clearDraft(score.judgeId, teamKey);
        stopTimer(teamKey);
        setScores((prev) => ({ ...prev, [teamKey]: acked }));
        setStates((prev) => ({ ...prev, [teamKey]: { kind: "saved", at: acked.savedAt } }));
        return;
      }

      if (shouldRetry(status)) {
        setStates((prev) => ({ ...prev, [teamKey]: { kind: "retrying", message: RETRY_LINE } }));
        /* Keeping an existing timer is safe now: it posts pending, not
           the score that first failed. */
        if (!timers.current[teamKey]) {
          timers.current[teamKey] = window.setInterval(() => {
            void attemptRef.current?.(teamKey);
          }, RETRY_MS);
        }
        return;
      }

      /* A refusal the server meant. Stop retrying, say what it said, and
         keep the draft: the judge can fix it and save again. */
      stopTimer(teamKey);
      if (status === 401) setUnauthorized(true);
      setStates((prev) => ({
        ...prev,
        [teamKey]: { kind: "refused", message: payload?.error ?? "The server refused this score. Tell Michael." },
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
    for (const key of Object.keys(timers.current)) window.clearInterval(timers.current[key]);
    timers.current = {};
    pending.current = {};
    inFlight.current = {};
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
        for (const d of drafts) {
          pending.current[d.teamKey] = d;
          lastStamp.current[d.teamKey] = stampOf(d);
          void attemptRef.current?.(d.teamKey);
        }
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

  /* Returns the score it stamped and sent, so the card knows which
     acknowledgement is its own. */
  const save = useCallback(
    (input: SaveInput): Score => {
      const stamp = stampFor(input.teamKey);
      const score: Score = { ...input, clientSavedAt: stamp, savedAt: stamp };
      writeDraft(score);
      pending.current[score.teamKey] = score;
      /* Optimistic: the queue shows the total straight away and paints it
         amber until the server confirms. */
      setScores((prev) => ({ ...prev, [score.teamKey]: score }));
      void attempt(score.teamKey);
      return score;
    },
    [attempt, stampFor],
  );

  return { scores, states, loadError, unauthorized, save };
}
