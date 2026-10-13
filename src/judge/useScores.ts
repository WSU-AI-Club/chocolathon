/* ═══════════════════════════════════════════════════════════════════
   useScores — the judge page's one promise: a score is never lost.

   Every Save stamps the payload (clientSavedAt), writes a draft to
   localStorage FIRST, puts the score in `pending`, then POSTs. A 200
   clears the draft and keeps the server's copy. A network failure or a
   5xx keeps the draft, paints the card amber, and retries every ten
   seconds until it lands. A refusal the server means (400 validation,
   401 wrong token, 423 judging closed) shows the server's own sentence
   and stops retrying, but only once the refusal is about the payload
   that is still pending: if the judge has already replaced it, that
   newer one goes out instead. The draft stays either way, so nothing a
   judge typed disappears because a request came back.

   clientSavedAt is not a clock this file compares against anybody
   else's. Device clocks disagree by minutes, and the server now takes
   whatever arrives last (api/scores.ts) rather than refereeing between
   two devices' stamps. The stamp is here so this device can tell which
   acknowledgement is for which of ITS OWN payloads: it is matched, not
   ordered, and never against a stamp another device wrote.

   `pending` holds ONE score per team: the latest. The retry timer reads
   it at fire time rather than closing over the score that first failed,
   so a judge who corrects a card while the wifi is out sends the
   correction, not the version they threw away. A 200 is only the end of
   the story when the acknowledged payload is the one still pending
   (nextPending); otherwise the newer one is posted at once and the
   draft stays put. That sequence — save v1 offline, save v2 offline,
   network back — is the test at the bottom of useScores.test.ts.

   On load, a draft in storage is by definition unsent (drafts are
   cleared only by the acknowledgement of the payload they hold). It is
   posted at once when the server holds nothing for that team: there is
   nothing it can overwrite. When the server DOES hold a score, posting
   it would be this device deciding a race it cannot see — the judge may
   have re-scored that team from another device an hour later, and the
   server takes the arrival, so the old draft would win by being late.
   So the draft is kept, the card shows the saved score, and the judge is
   asked which one they meant (ScoreCard's prompt). Same answer while
   judging is closed, and when the read itself failed: a server we could
   not read is not a server we know is empty. Every team without a draft
   takes the server copy as it stands.

   The judge can change under all of this: "Not you? Switch" starts a
   new session, and every await here checks that it is still in the
   session it started in before it writes anything, so an answer to the
   last judge's save never lands in the next judge's cards.
   ═══════════════════════════════════════════════════════════════════ */

import { apiUrl } from "../lib/api";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Score } from "../judging/types";

export const draftKey = (judgeId: string, teamKey: string) => `choco-draft:${judgeId}:${teamKey}`;

/* What a Save is, before the two timestamps this file owns. */
export type SaveInput = Omit<Score, "savedAt" | "clientSavedAt">;

/* The stamp a payload carries. A score written before clientSavedAt
   existed has only savedAt, and matching on the one stamp it has beats
   treating a judge's unsent draft as unmatchable. */
export const stampOf = (score: Pick<Score, "clientSavedAt" | "savedAt">): string =>
  score.clientSavedAt || score.savedAt || "";

/* On load: the server copy for every team, and a draft only where the
   server has nothing. A draft is unsent work, so it is never thrown
   away — but it is not shown in place of a score the server already
   holds either, because that score may be newer than anything this
   device knows about. No stamp is compared here: which is newer is
   exactly the question two devices' clocks cannot answer. What the
   draft is FOR is planLoad's job. */
export function mergeScores(server: Score[], drafts: Score[]): Record<string, Score> {
  const out: Record<string, Score> = {};
  for (const s of server) out[s.teamKey] = s;
  for (const d of drafts) if (!out[d.teamKey]) out[d.teamKey] = d;
  return out;
}

/* What the page does with each draft it finds on the device.

   post — the server has never seen this team from this judge, so the
     draft cannot overwrite anything: send it, exactly as before.
   held — the server has a score for that team, or judging is closed, or
     the read failed. Nothing is posted; the draft stays in storage and
     the card offers it to the judge (`unsentDraft`).
   done — the server's copy carries this draft's own stamp, so the POST
     did land and only its answer was lost. Nothing is owed: drop it.

   `server` is null when the read failed. Empty and unknown are
   different answers, and only one of them means "nothing to overwrite". */
export type LoadPlan = { scores: Record<string, Score>; post: Score[]; held: Score[]; done: Score[] };

export function planLoad(server: Score[] | null, drafts: Score[], closed: boolean): LoadPlan {
  const list = server ?? [];
  const saved: Record<string, Score> = {};
  for (const s of list) saved[s.teamKey] = s;
  const plan: LoadPlan = { scores: mergeScores(list, drafts), post: [], held: [], done: [] };
  for (const d of drafts) {
    const mine = saved[d.teamKey];
    if (mine && stampOf(mine) === stampOf(d)) plan.done.push(d);
    else if (closed || server === null || mine) plan.held.push(d);
    else plan.post.push(d);
  }
  return plan;
}

/* After an answer: what still has to be posted, or null when this save
   is finished and the draft can go. `acked` is what the server said it
   now holds, which is our own payload echoed back, and the match is on
   the stamp string, not on which stamp is larger. A pending payload the
   server has not named is still owed, whether the judge typed it while
   this POST was in the air or the answer was about something else.

   A server that does not echo clientSavedAt is an older deploy mid
   rollout; treat its 200 as an acknowledgement rather than posting for
   ever against a field it will never return. */
export function nextPending(pending: Score | undefined | null, acked: Score | undefined | null): Score | null {
  if (!pending) return null;
  if (!acked) return pending;
  if (!acked.clientSavedAt) return null;
  return acked.clientSavedAt === stampOf(pending) ? null : pending;
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
const REFUSED_LINE = "The server refused this score. Tell Michael.";
const READ_FAILED = "Could not read your saved scores. Anything you save now is kept on this device and sent again.";
const OFFLINE_LINE = "Could not reach the server. Anything you save now is kept on this device and sent again.";

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
         carry one, so its acknowledgement can be matched. */
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

/* ── one attempt, out of the hook so a test can drive it ─────────────
   Everything the POST touches arrives as a dependency: the pending and
   in-flight maps by reference, the timer and draft and state writers,
   and the fetch itself. The hook wires them to its refs; the test wires
   them to plain objects and a fetch that resolves when it chooses. */
export type PostReply = { ok?: boolean; score?: Score; error?: string };

type FetchLike = (
  input: string,
  init: { method: string; cache: "no-store"; headers: Record<string, string>; body: string },
) => Promise<{ status: number; json: () => Promise<unknown> }>;

export type SaveDeps = {
  token: string;
  /* The session this device is in right now. Read once at the start and
     again after the answer: a judge switch in between means everything
     below belongs to somebody who is no longer on this page. */
  session: () => number;
  pending: Record<string, Score>;
  inFlight: Record<string, boolean>;
  fetcher: FetchLike;
  ensureTimer: (teamKey: string) => void;
  stopTimer: (teamKey: string) => void;
  clearDraft: (judgeId: string, teamKey: string) => void;
  setScore: (teamKey: string, score: Score) => void;
  setState: (teamKey: string, state: SaveState) => void;
  onUnauthorized: () => void;
  again: (teamKey: string) => void;
};

export async function postPending(deps: SaveDeps, teamKey: string): Promise<void> {
  const score = deps.pending[teamKey];
  if (!score) {
    deps.stopTimer(teamKey);
    return;
  }
  /* One request per team at a time. A save made while this one is in
     the air is in pending already and goes out on the answer. */
  if (deps.inFlight[teamKey]) return;
  const mySession = deps.session();
  deps.inFlight[teamKey] = true;
  deps.setState(teamKey, { kind: "saving" });

  let status: number | null = null;
  let payload: PostReply | null = null;
  try {
    const res = await deps.fetcher(apiUrl("/api/scores"), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-judge-key": deps.token },
      body: JSON.stringify(score),
    });
    status = res.status;
    try {
      payload = (await res.json()) as PostReply;
    } catch {
      payload = null;
    }
  } catch {
    status = null;
  } finally {
    deps.inFlight[teamKey] = false;
  }

  /* The judge switched while this was in the air. The answer describes
     a judge who is no longer here: no score, no state, no cleared
     draft, no timer. */
  if (deps.session() !== mySession) return;

  if (status === 200) {
    /* What the server now holds. It writes whatever arrives, so this is
       our own payload echoed back; the fallback covers a body that did
       not parse. */
    const acked = payload?.score ?? score;
    const latest = deps.pending[teamKey];
    let next = nextPending(latest, acked);
    /* An echo that matches nothing, for the very payload we just sent:
       the server takes every arrival, so the write landed. Finish
       instead of posting the same bytes for ever. */
    if (next && latest && stampOf(latest) === stampOf(score)) next = null;
    if (next) {
      /* A correction was typed while this was in the air. The draft and
         the timer both stay; post the newer one now. */
      deps.setScore(teamKey, next);
      deps.again(teamKey);
      return;
    }
    /* Only here is the acknowledgement for the latest pending payload,
       and only here has the draft nothing left to protect. */
    delete deps.pending[teamKey];
    deps.clearDraft(score.judgeId, teamKey);
    deps.stopTimer(teamKey);
    deps.setScore(teamKey, acked);
    deps.setState(teamKey, { kind: "saved", at: acked.savedAt });
    return;
  }

  if (shouldRetry(status)) {
    deps.setState(teamKey, { kind: "retrying", message: RETRY_LINE });
    /* Keeping an existing timer is safe: it posts pending, not the
       score that first failed. */
    deps.ensureTimer(teamKey);
    return;
  }

  /* A refusal the server meant. If the judge has already replaced what
     was refused, the refusal describes a payload that no longer exists
     on this card: send the newer one once rather than stranding it and
     showing a sentence about a version the judge threw away. */
  const stranded = nextPending(deps.pending[teamKey], score);
  if (stranded) {
    deps.again(teamKey);
    return;
  }
  /* The refusal is about the latest pending payload. Stop retrying, say
     what the server said, and keep the draft: the judge can fix it and
     save again. */
  deps.stopTimer(teamKey);
  if (status === 401) deps.onUnauthorized();
  deps.setState(teamKey, { kind: "refused", message: payload?.error ?? REFUSED_LINE });
}

/* ── the load, out of the hook for the same reason ───────────────────
   One GET, then planLoad decides what each draft is for. Nothing here
   starts a timer: a held draft is not a failed save, and the only thing
   that moves it now is the judge answering the prompt. */
type GetLike = (
  input: string,
  init: { cache: "no-store"; headers: Record<string, string> },
) => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }>;

export type LoadDeps = {
  judgeId: string;
  token: string;
  /* From the judge list. A draft is never posted before this is known,
     because a POST into closed judging is refused and the judge would
     be shown a red sentence about a score they cannot resend. */
  closed: boolean;
  drafts: Score[];
  fetcher: GetLike;
  dead: () => boolean;
  setScores: (scores: Record<string, Score>) => void;
  setUnsent: (unsent: Record<string, Score>) => void;
  setStates: (states: Record<string, SaveState>) => void;
  setLoadError: (message: string) => void;
  onUnauthorized: () => void;
  clearDraft: (teamKey: string) => void;
  post: (score: Score) => void;
};

export async function loadScores(deps: LoadDeps): Promise<void> {
  /* null, not [], while the answer is unknown: see planLoad. */
  let server: Score[] | null = null;
  try {
    const res = await deps.fetcher(apiUrl(`/api/scores?judge=${encodeURIComponent(deps.judgeId)}`), {
      cache: "no-store",
      headers: { "x-judge-key": deps.token },
    });
    if (deps.dead()) return;
    if (res.status === 401) {
      deps.onUnauthorized();
    } else if (res.ok) {
      const body = (await res.json()) as { scores?: Score[] };
      if (deps.dead()) return;
      server = Array.isArray(body.scores) ? body.scores : [];
    } else {
      deps.setLoadError(READ_FAILED);
    }
  } catch {
    if (deps.dead()) return;
    deps.setLoadError(OFFLINE_LINE);
  }
  if (deps.dead()) return;

  const plan = planLoad(server, deps.drafts, deps.closed);
  deps.setScores(plan.scores);
  /* The POST landed and only the answer was lost. Storage is the only
     place that still thinks something is owed. */
  for (const d of plan.done) deps.clearDraft(d.teamKey);
  if (plan.held.length) deps.setUnsent(Object.fromEntries(plan.held.map((d) => [d.teamKey, d])));
  if (plan.post.length) {
    deps.setStates(Object.fromEntries(plan.post.map((d) => [d.teamKey, { kind: "retrying", message: RETRY_LINE } as SaveState])));
    for (const d of plan.post) deps.post(d);
  }
}

/* ── the two answers to the prompt ───────────────────────────────────
   Send hands the held draft back to the ordinary save path: a new
   stamp, a new draft, a POST that arrives after the saved copy and
   therefore replaces it — the same rule as any other Save, which is why
   this is not a second way to write a score. Keep deletes the draft;
   the card is already showing the server's copy, so there is nothing
   else to adopt. Neither one can run by itself: a judge chose. */
export type PromptDeps = {
  save: (input: SaveInput) => Score | null;
  clearDraft: (teamKey: string) => void;
  forget: (teamKey: string) => void;
};

const unsentInput = (d: Score): SaveInput => ({
  judgeId: d.judgeId,
  teamKey: d.teamKey,
  track: d.track,
  gates: d.gates,
  recused: d.recused,
  lines: d.lines,
  total: d.total,
  comment: d.comment,
});

export function sendUnsentDraft(deps: PromptDeps, draft: Score): Score | null {
  deps.forget(draft.teamKey);
  return deps.save(unsentInput(draft));
}

export function keepSavedScore(deps: PromptDeps, teamKey: string): void {
  deps.clearDraft(teamKey);
  deps.forget(teamKey);
}

/* `closed` is null until the judge list lands. The page shows no cards
   until then, and nothing is posted on a guess. */
export function useScores(judgeId: string | null, token: string | null, closed: boolean | null) {
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [states, setStates] = useState<Record<string, SaveState>>({});
  /* Drafts this device is holding rather than posting: one per team, the
     judge's unsent work, waiting for them to say which score they meant. */
  const [unsent, setUnsent] = useState<Record<string, Score>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  /* False until the one GET has been answered (or failed). The stepper
     waits for it: "the first unscored team" is not a question that can
     be answered against an empty map, and a judge who lands on team one
     and is then moved under their thumb has lost their place. */
  const [loaded, setLoaded] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const timers = useRef<Record<string, number>>({});
  /* One entry per team: the latest save that has not been acknowledged.
     Everything else in this file reads it at the moment it acts. */
  const pending = useRef<Record<string, Score>>({});
  const inFlight = useRef<Record<string, boolean>>({});
  const lastStamp = useRef<Record<string, string>>({});
  /* Bumped every time the judge changes. Anything that was in the air
     across the change is thrown away rather than written into the new
     judge's cards. */
  const session = useRef(0);
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

  const ensureTimer = useCallback((teamKey: string) => {
    if (timers.current[teamKey]) return;
    timers.current[teamKey] = window.setInterval(() => {
      void attemptRef.current?.(teamKey);
    }, RETRY_MS);
  }, []);

  /* Two saves inside the same millisecond would tie, and a tie makes
     two payloads indistinguishable. Stamps only ever move forward. */
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
      await postPending(
        {
          token,
          session: () => session.current,
          pending: pending.current,
          inFlight: inFlight.current,
          fetcher: (input, init) => fetch(input, init),
          ensureTimer,
          stopTimer,
          clearDraft,
          setScore: (key, score) => setScores((prev) => ({ ...prev, [key]: score })),
          setState: (key, state) => setStates((prev) => ({ ...prev, [key]: state })),
          onUnauthorized: () => setUnauthorized(true),
          again: (key) => void attemptRef.current?.(key),
        },
        teamKey,
      );
    },
    [ensureTimer, stopTimer, token],
  );

  attemptRef.current = attempt;

  /* Load once per judge, in a new session. A draft is posted only where
     the server holds nothing for that team (planLoad); everything else
     it finds is held for the judge to answer. */
  useEffect(() => {
    session.current += 1;
    const mySession = session.current;
    setScores({});
    setStates({});
    setUnsent({});
    setLoadError(null);
    setLoaded(false);
    for (const key of Object.keys(timers.current)) window.clearInterval(timers.current[key]);
    timers.current = {};
    pending.current = {};
    inFlight.current = {};
    if (!judgeId || !token || closed === null) return;

    let cancelled = false;
    /* Cancelled, or the judge changed under the request. Either way the
       answer is about a page that is no longer on the screen. */
    const dead = () => cancelled || session.current !== mySession;
    const drafts = readDrafts(judgeId);
    /* Held or posted, a draft is still the newest stamp this device has
       written for that team, so the next Save has to clear it. */
    for (const d of drafts) lastStamp.current[d.teamKey] = stampOf(d);

    void loadScores({
      judgeId,
      token,
      closed,
      drafts,
      fetcher: (input, init) => fetch(input, init),
      dead,
      setScores,
      setUnsent,
      setStates,
      setLoadError,
      onUnauthorized: () => setUnauthorized(true),
      clearDraft: (teamKey) => clearDraft(judgeId, teamKey),
      post: (score) => {
        pending.current[score.teamKey] = score;
        void attemptRef.current?.(score.teamKey);
      },
    }).then(() => {
      if (!dead()) setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [judgeId, token, closed]);

  /* Timers outlive a card unmount on purpose (a judge scrolling away
     must not stop a retry), but never the page. */
  useEffect(
    () => () => {
      for (const key of Object.keys(timers.current)) window.clearInterval(timers.current[key]);
      timers.current = {};
    },
    [],
  );

  /* A held draft is gone the moment there is a newer payload for that
     team, whichever button produced it: the prompt is about work that
     has not been sent, and this one is being sent now. */
  const forget = useCallback((teamKey: string) => {
    setUnsent((prev) => {
      if (!prev[teamKey]) return prev;
      const next = { ...prev };
      delete next[teamKey];
      return next;
    });
  }, []);

  /* Returns the score it stamped and sent, so the card knows which
     acknowledgement is its own. */
  const save = useCallback(
    (input: SaveInput): Score => {
      const stamp = stampFor(input.teamKey);
      const score: Score = { ...input, clientSavedAt: stamp, savedAt: stamp };
      forget(score.teamKey);
      writeDraft(score);
      pending.current[score.teamKey] = score;
      /* Optimistic: the queue shows the total straight away and paints it
         amber until the server confirms. */
      setScores((prev) => ({ ...prev, [score.teamKey]: score }));
      void attempt(score.teamKey);
      return score;
    },
    [attempt, forget, stampFor],
  );

  const promptDeps = useCallback(
    (): PromptDeps => ({
      save,
      clearDraft: (teamKey) => clearDraft(judgeId ?? "", teamKey),
      forget,
    }),
    [forget, judgeId, save],
  );

  /* "Send the unsent one". Returns the score it sent, like save. */
  const sendUnsent = useCallback(
    (teamKey: string): Score | null => {
      const draft = unsent[teamKey];
      if (!draft) return null;
      return sendUnsentDraft(promptDeps(), draft);
    },
    [promptDeps, unsent],
  );

  /* "Keep the saved one". */
  const keepSaved = useCallback(
    (teamKey: string): void => {
      if (!judgeId) return;
      keepSavedScore(promptDeps(), teamKey);
    },
    [judgeId, promptDeps],
  );

  return { scores, states, unsent, loaded, loadError, unauthorized, save, sendUnsent, keepSaved };
}
