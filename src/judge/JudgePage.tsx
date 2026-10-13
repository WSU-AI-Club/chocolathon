/* ═══════════════════════════════════════════════════════════════════
   JUDGE PAGE — the ninety minutes between 2:00 and 3:30 on September
   19, for five judges on their own phones and laptops.

   The link carries a token (?k=…). Without it the page says one line
   and nothing else: the path is unlisted, but the token is what stops
   anyone who guessed the URL from writing scores. It is stored on the
   device on first open and stripped from the address bar, so a judge
   who reloads or shares a screenshot does not leak it.

   Then: pick your name once, and work one team at a time. Michael read
   the live page on the 15th and asked for a stepper instead of a stack:
   the strip of pills says where the judge is in the hand they were
   dealt, one card is mounted under it, and Back and Next move between
   them. One card mounted means one video loading, which is the whole
   point on a phone on a conference wifi; nine embeds racing each other
   was the version he saw.

   The stepper will not let a judge walk away from work that is not
   stored. Next is dark until this team has a score on the server (a
   recusal and a failed gate are scores), and while the card differs
   from what is stored, or a save is in the air, or this device is
   holding a draft it never sent, Back, Next and every pill are held
   with one sentence saying why. Closed judging drops all of it: there
   is nothing left to save and the whole track is there to read.

   Saves that fail are kept on the device and retried; nothing is ever
   lost quietly (see useScores.ts). Where the judge is, and whether they
   may leave, are decided in stepper.ts, where both can be tested
   without a browser.

   Three reads, all no-store: /api/judging (the published submissions),
   /api/judging-config (judges, assignments, the closed switch), and
   /api/hub (the rubric text and prompt titles, the same words the
   teams saw). The first two carry the judge token, because they carry
   student work; a 401 from either says the same line as a 401 on a
   score. Only the last one is optional.
   ═══════════════════════════════════════════════════════════════════ */

import { apiUrl } from "../lib/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Block, HubData } from "../competitor/types";
import type { JudgingConfig, Score, Track } from "../judging/types";
import type { Judging, Submission } from "./mapRows";
import ScoreCard from "./ScoreCard";
import {
  backPosition,
  canAdvance,
  canGoBack,
  enterOthers,
  firstUnscored,
  lockLine,
  markFor,
  navLocked,
  nextPosition,
  type NavReason,
  type Position,
} from "./stepper";
import { useScores, type SaveInput, type SaveState } from "./useScores";
import "../chocolathon.css";

type Rubric = Extract<Block, { kind: "rubric" }>;

const BAD_LINK =
  "This link is not valid. Open the judge link from Michael's message again, in this browser; if it still says this, text Michael and he will send it again.";
const PANEL_CHANGED = "Pick your name again; the panel changed.";
const NO_TEAM_KEY = "This set was published before team keys existed. Ask Michael to publish again.";
const SAMPLE_LINE = "These are sample rows. The real export replaces them at 2:00 on the 19th.";
const TOKEN_KEY = "choco-judge-key";
const JUDGE_KEY = "choco-judge-id";

/* Same slug the upload page's mapRows writes into teamKey. Only used as
   a fallback for a set published before teamKey existed, so a stale
   blob shows real cards instead of undefined ones. */
function teamKeyOf(s: Submission): string {
  if (s.teamKey) return s.teamKey;
  const slug = s.team
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${s.track}/${slug}`;
}

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* A judge with storage blocked simply picks their name again. */
  }
}

type Load = {
  judging: Judging | null;
  judgingError: string | null;
  config: JudgingConfig | null;
  configError: string | null;
  hub: HubData | null;
  done: boolean;
};

export default function JudgePage() {
  /* Read synchronously so the "not valid" line never flashes at a judge
     who does have the token. */
  const [token] = useState<string | null>(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("k");
      if (fromUrl) {
        writeLocal(TOKEN_KEY, fromUrl);
        return fromUrl;
      }
    } catch {
      /* fall through to storage */
    }
    return readLocal(TOKEN_KEY);
  });
  const [judge, setJudge] = useState<string | null>(() => readLocal(JUDGE_KEY));
  const [track, setTrack] = useState<Track>("build");
  /* A 401 from any gated read means the same thing a 401 on a score
     does: the token in the link is not the one the server wants. */
  const [tokenRefused, setTokenRefused] = useState(false);
  const [panelChanged, setPanelChanged] = useState(false);
  /* Teams whose save the page refused itself, so no doomed POST goes
     out. Keyed by the same fallback key the cards carry. */
  const [noKey, setNoKey] = useState<Record<string, true>>({});
  const [load, setLoad] = useState<Load>({
    judging: null,
    judgingError: null,
    config: null,
    configError: null,
    hub: null,
    done: false,
  });

  useEffect(() => {
    document.title = "Chocolathon — Judging";
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  /* The token STAYS in the address bar (2026-09-19). Until today the page
     stripped it after reading it, which broke the two things judges do
     with a link on the day: "open in Safari/Chrome" from a mail app's
     built-in browser, and copying the address to another device. Both
     handed over the stripped path, and the new browser had no token in
     storage, so it saw "This link is not valid". A token in the bar is
     a smaller risk than a judge who cannot open their queue. */

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const get = async (path: string, gated = false) => {
        try {
          /* /api/judging and /api/judging-config take either key. They
             answered without one before the judge token was added, so
             sending it is safe against both deploys. */
          return await fetch(path, { cache: "no-store", headers: gated ? { "x-judge-key": token } : undefined });
        } catch {
          return null;
        }
      };
      const [j, c, h] = await Promise.all([get(apiUrl("/api/judging"), true), get(apiUrl("/api/judging-config"), true), get(apiUrl("/api/hub"))]);
      if (cancelled) return;

      if ((j && j.status === 401) || (c && c.status === 401)) {
        setTokenRefused(true);
        return;
      }

      let judging: Judging | null = null;
      let judgingError: string | null = null;
      if (j && j.ok) {
        try {
          judging = (await j.json()) as Judging;
        } catch {
          judgingError = "The published submissions could not be read. Tell Michael.";
        }
      } else if (j && j.status === 404) {
        judgingError = "Nothing published yet. Michael publishes at 2:00.";
      } else {
        judgingError = "Could not load the submissions. Refresh the page.";
      }

      let config: JudgingConfig | null = null;
      let configError: string | null = null;
      if (c && c.ok) {
        try {
          config = (await c.json()) as JudgingConfig;
        } catch {
          configError = "The judge list could not be read. Tell Michael.";
        }
      } else if (c && c.status === 404) {
        configError = "The judges are not set up yet.";
      } else {
        configError = "Could not load the judge list. Refresh the page.";
      }

      let hub: HubData | null = null;
      if (h && h.ok) {
        try {
          hub = (await h.json()) as HubData;
        } catch {
          hub = null;
        }
      }

      if (!cancelled) setLoad({ judging, judgingError, config, configError, hub, done: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  /* Null until the judge list lands. useScores must not post a draft
     before it knows whether judging is closed, and no card is on the
     screen until then either, so waiting costs nothing. */
  const closedYet: boolean | null = load.done ? (load.config?.closed ?? false) : null;
  const closed = closedYet === true;

  const { scores, states, unsent, loaded, loadError, unauthorized, save, sendUnsent, keepSaved } = useScores(
    judge,
    token,
    closedYet,
  );

  /* The panel is one list Michael publishes. A judge whose name is no
     longer on it (a rename, a swap on the morning of) would otherwise
     sit in front of an empty queue wondering why. */
  useEffect(() => {
    if (!load.config || !judge) return;
    if (load.config.judges.some((x) => x.id === judge)) return;
    try {
      localStorage.removeItem(JUDGE_KEY);
    } catch {
      /* ignore */
    }
    setJudge(null);
    setPanelChanged(true);
  }, [load.config, judge]);

  const judges = load.config?.judges ?? [];
  const me = judges.find((x) => x.id === judge) ?? null;

  /* A judge on one track never sees the toggle; "both" (and a judge
     Michael left on "off" by mistake) gets it. */
  const canSwitch = me ? me.tracks === "both" || me.tracks === "off" : false;
  useEffect(() => {
    if (me && (me.tracks === "build" || me.tracks === "pitch")) setTrack(me.tracks);
  }, [me]);

  const subs = useMemo(() => {
    const list = load.judging?.submissions ?? [];
    const excluded = new Set(load.config?.excluded ?? []);
    return list
      .filter((s) => !s.duplicateOf)
      .map((s) => ({ ...s, teamKey: teamKeyOf(s), published: Boolean(s.teamKey) }))
      .filter((s) => !excluded.has(s.teamKey));
  }, [load.judging, load.config]);

  const mine = useMemo(() => {
    const a = load.config?.assignments ?? {};
    return subs.filter((s) => s.track === track && (a[s.teamKey] ?? []).includes(judge ?? ""));
  }, [subs, track, load.config, judge]);

  const others = useMemo(() => {
    const keys = new Set(mine.map((s) => s.teamKey));
    return subs.filter((s) => s.track === track && !keys.has(s.teamKey));
  }, [subs, mine, track]);

  const rubric = useMemo<Rubric | null>(() => {
    if (!load.hub) return null;
    const section = load.hub.sections.find((x) => x.id === "rubric");
    if (!section) return null;
    const want = track === "build" ? "Build Track" : "Pitch Track";
    return (
      section.blocks.find((b): b is Rubric => b.kind === "rubric" && b.label.includes(want)) ?? null
    );
  }, [load.hub, track]);

  const promptTitle = (id: string) => load.hub?.prompts.find((p) => p.id === id)?.title ?? "";

  const scoredCount = mine.filter((s) => scores[s.teamKey]).length;

  /* ── the stepper ──────────────────────────────────────────────────
     Where the judge is, what the card on the screen has said about
     itself, and one counter, so a move puts the new card under the
     header instead of leaving the judge halfway down the old one. */
  const [pos, setPos] = useState<Position>({ phase: "assigned", index: 0, ended: false });
  const [edited, setEdited] = useState<{ key: string; on: boolean }>({ key: "", on: false });
  const placedFor = useRef<string | null>(null);
  const [navAt, setNavAt] = useState(0);
  const cardTop = useRef<HTMLDivElement>(null);

  const onChanged = useCallback((teamKey: string, on: boolean) => {
    setEdited((prev) => (prev.key === teamKey && prev.on === on ? prev : { key: teamKey, on }));
  }, []);

  /* Landing. Once per judge and track, and only once the scores are in:
     "the first unscored team" against an empty map is always team one,
     and a judge moved off their card a second after they arrived has
     lost their place. */
  useEffect(() => {
    if (!judge || !load.done || !loaded) return;
    const k = `${judge}|${track}`;
    if (placedFor.current === k) return;
    placedFor.current = k;
    setPos({
      phase: "assigned",
      index: firstUnscored(
        mine.map((s) => s.teamKey),
        scores,
      ),
      ended: mine.length === 0,
    });
    setEdited({ key: "", on: false });
  }, [judge, track, load.done, loaded, mine, scores]);

  const list = pos.phase === "assigned" ? mine : others;
  const index = Math.min(pos.index, Math.max(0, list.length - 1));
  const showEnd = pos.ended || list.length === 0;
  const current = showEnd ? null : (list[index] ?? null);
  const currentKey = current?.teamKey ?? "";
  const here: Position = { phase: pos.phase, index, ended: showEnd };

  const cardState = useCallback(
    (teamKey: string): SaveState =>
      noKey[teamKey] ? { kind: "refused", message: NO_TEAM_KEY } : (states[teamKey] ?? { kind: "idle" }),
    [noKey, states],
  );

  const st = cardState(currentKey);
  /* An unsent draft is a question the judge has not answered yet
     (ScoreCard's Send / Keep block), and an unanswered question is
     unsaved work. A refusal is not: there is nothing a judge can do
     about a score the server will not take, so it holds nobody here. */
  const reason: NavReason = closed || !current
    ? null
    : edited.key === currentKey && edited.on
      ? "edits"
      : st.kind === "saving"
        ? "saving"
        : st.kind === "retrying"
          ? "retrying"
          : unsent[currentKey]
            ? "prompt"
            : null;

  const locked = navLocked(closed, reason);
  const saved = Boolean(scores[currentKey]);
  const nextOk = canAdvance(closed, reason, saved);
  const backOk = !locked && canGoBack(here, mine.length, others.length);

  const move = (next: Position) => {
    setPos(next);
    setNavAt((n) => n + 1);
  };
  const goNext = () => {
    if (!nextOk) return;
    move(nextPosition(here, mine.length, others.length));
  };
  const goBack = () => {
    if (!backOk) return;
    move(backPosition(here, mine.length, others.length));
  };
  const goTo = (i: number) => {
    if (locked) return;
    move({ phase: pos.phase, index: i, ended: false });
  };
  const goOthers = () => {
    const next = enterOthers(others.length);
    if (next) move(next);
  };
  const goAssigned = () => {
    move({ phase: "assigned", index: Math.max(0, mine.length - 1), ended: mine.length > 0 });
  };

  useEffect(() => {
    if (!navAt) return;
    cardTop.current?.scrollIntoView({ block: "start" });
  }, [navAt]);

  /* A submissions blob published before teamKey existed gives the cards
     a key this page invented. The server keys scores by the published
     one and would refuse every save, so refuse here instead and say why,
     rather than letting a judge score a card whose Save cannot land. */
  const missingKey = useMemo(
    () => new Set(subs.filter((s) => !s.published).map((s) => s.teamKey)),
    [subs],
  );

  const guardedSave = useCallback(
    (input: SaveInput): Score | null => {
      if (missingKey.has(input.teamKey)) {
        setNoKey((prev) => ({ ...prev, [input.teamKey]: true }));
        return null;
      }
      return save(input);
    },
    [missingKey, save],
  );

  /* "Send the unsent one" goes out through the same gate as Save: a
     team whose key the page cannot save is a team whose draft cannot
     land either, and a doomed POST would say so in red. */
  const guardedSendUnsent = useCallback(
    (teamKey: string): Score | null => {
      if (missingKey.has(teamKey)) {
        setNoKey((prev) => ({ ...prev, [teamKey]: true }));
        return null;
      }
      return sendUnsent(teamKey);
    },
    [missingKey, sendUnsent],
  );

  const switchJudge = () => {
    try {
      localStorage.removeItem(JUDGE_KEY);
    } catch {
      /* ignore */
    }
    setJudge(null);
  };

  const pick = (id: string) => {
    writeLocal(JUDGE_KEY, id);
    setPanelChanged(false);
    setJudge(id);
  };

  /* The end screen only claims what is true. Stepping through saves
     every card on the way, but a judge who jumped to the last pill and
     pressed Next did not, and "All 9 saved" would be the page telling
     them something it cannot see. */
  const endLine =
    pos.phase === "others"
      ? "That is every team in this track. Thank you."
      : mine.length === 0
        ? "No teams are assigned to you in this track."
        : scoredCount < mine.length
          ? `${scoredCount} of ${mine.length} assigned teams saved. The rest are in the strip above.`
          : mine.length === 1
            ? "Your one assigned team is saved. Thank you."
            : `All ${mine.length} assigned teams saved. Thank you.`;

  /* Nothing renders without the token, on purpose. */
  if (!token || unauthorized || tokenRefused) {
    return (
      <div className="choco-root min-h-screen bg-white">
        <main className="mx-auto max-w-2xl px-5 py-32 sm:px-8">
          <p className="text-lg leading-relaxed text-ink">{BAD_LINK}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="choco-root min-h-screen bg-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.08] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2.5 sm:px-8">
          <span className="label label-strong">Chocolathon · Judging</span>
          <div className="flex items-center gap-3">
            <div
              role="tablist"
              aria-label="Track"
              className="inline-flex gap-px overflow-hidden rounded-sm bg-ink/15 p-px"
              style={canSwitch ? undefined : { display: "none" }}
            >
              {(["build", "pitch"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={track === t}
                  disabled={locked}
                  onClick={() => setTrack(t)}
                  className={
                    "label px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
                    (track === t ? "bg-ink !text-white" : "bg-white hover:!text-ink")
                  }
                >
                  {t === "build" ? "Build" : "Pitch"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={switchJudge}
              className="label -my-3 inline-flex min-h-[44px] items-center underline underline-offset-4"
              style={judge ? undefined : { visibility: "hidden" }}
            >
              Not you? Switch
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-24 sm:px-8">
        {!load.done ? (
          <p className="label">Loading…</p>
        ) : !load.config ? (
          <p className="max-w-xl text-lg leading-relaxed text-ink">{load.configError}</p>
        ) : !judge ? (
          <section>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
              Who are you?
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/80">
              {panelChanged ? PANEL_CHANGED : "Pick your name once. This device remembers it."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[...judges.filter((x) => x.tracks !== "off"), ...judges.filter((x) => x.tracks === "off")].map((x) => (
                <button key={x.id} type="button" className="btn-ghost" onClick={() => pick(x.id)}>
                  {x.name}
                </button>
              ))}
            </div>
            {judges.length === 0 ? (
              <p className="mt-8 max-w-xl text-base leading-relaxed text-ink/80">
                No judges are set up yet. Tell Michael.
              </p>
            ) : null}
          </section>
        ) : !load.judging ? (
          <p className="max-w-xl text-lg leading-relaxed text-ink">{load.judgingError}</p>
        ) : (
          <>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {closed
                ? "Judging is closed. Thank you."
                : `${(me?.name ?? "").split(" ")[0]} · ${track === "build" ? "Build" : "Pitch"} track · ${scoredCount} of ${mine.length} scored`}
            </h1>
            {loadError ? <p className="label mt-3 !text-goldink">{loadError}</p> : null}
            {load.judging.sample ? (
              <p className="mt-6 border-l-2 border-gold pl-4 text-base leading-relaxed text-ink">
                <strong className="font-semibold">Rehearsal data.</strong> {SAMPLE_LINE}
              </p>
            ) : null}

            {/* ── the progress strip ─────────────────────────────────── */}
            <nav aria-label="Teams" className="mt-6 border-y border-ink/15 py-3">
              {pos.phase === "others" ? <p className="label mb-2">Not assigned to you</p> : null}
              {list.length === 0 ? (
                <p className="label py-1">Nothing in this track yet.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {list.map((s, i) => {
                    const sc: Score | undefined = scores[s.teamKey];
                    const cs = states[s.teamKey];
                    /* Amber is "the server has not confirmed this yet",
                       which a save in flight is too. Without it a team
                       being retried every ten seconds blinks back to
                       black for the length of each attempt. */
                    const amber = Boolean(
                      (cs && (cs.kind === "saving" || cs.kind === "retrying" || cs.kind === "refused")) ||
                        noKey[s.teamKey] ||
                        unsent[s.teamKey],
                    );
                    const mark = markFor(sc, amber);
                    const on = !showEnd && s.teamKey === currentKey;
                    return (
                      <li key={s.teamKey}>
                        <button
                          type="button"
                          disabled={locked}
                          aria-current={on ? "true" : undefined}
                          onClick={() => goTo(i)}
                          className={
                            "flex min-h-[44px] max-w-[15rem] items-center gap-2 rounded-sm border px-3 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:px-2.5 " +
                            (on ? "border-ink bg-ink" : "border-ink/20 bg-white hover:border-ink/50 hover:bg-ink/[0.04]")
                          }
                        >
                          <span className={"label truncate " + (on ? "!text-white" : "label-strong")}>{s.team}</span>
                          {/* Amber survives on the pill the judge is
                              standing on: the lighter gold reads on
                              ink, and a save that has not landed is
                              exactly the thing not to lose. */}
                          <span
                            className={
                              "label shrink-0 tabular-nums " +
                              (on
                                ? mark.amber
                                  ? "!text-gold"
                                  : "!text-white"
                                : mark.amber
                                  ? "!text-goldink"
                                  : "label-strong")
                            }
                          >
                            {mark.text}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>

            <div ref={cardTop} className="scroll-mt-24">
              {current ? (
                <>
                  <ol className="mt-2">
                    <ScoreCard
                      key={current.teamKey}
                      submission={current}
                      rubric={rubric}
                      promptTitle={promptTitle(current.prompt)}
                      score={scores[current.teamKey]}
                      state={st}
                      closed={closed}
                      judgeId={judge}
                      assigned={pos.phase === "assigned"}
                      unsentDraft={unsent[current.teamKey]}
                      onSave={guardedSave}
                      onSendUnsent={() => guardedSendUnsent(current.teamKey)}
                      onKeepSaved={() => keepSaved(current.teamKey)}
                      onChanged={onChanged}
                    />
                  </ol>

                  {/* ── Back, where you are, Next ───────────────────── */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    {/* Dimmed rather than removed when the lock is on:
                        the control keeps its place, and the sentence
                        under the row says what it is waiting for. */}
                    <button
                      type="button"
                      className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!backOk}
                      onClick={goBack}
                    >
                      Back
                    </button>
                    <span className="label order-last w-full text-center sm:order-none sm:w-auto">
                      Team {index + 1} of {list.length}
                    </span>
                    <button
                      type="button"
                      className="btn-cta disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!nextOk}
                      onClick={goNext}
                    >
                      Next
                    </button>
                  </div>
                  {/* Always here, so the control row does not jump a line
                      the moment a judge starts typing. */}
                  <p className="label mt-3 !text-goldink" style={locked ? undefined : { visibility: "hidden" }}>
                    {lockLine(reason) || lockLine("edits")}
                  </p>
                </>
              ) : (
                <section className="mt-10 border-t border-ink/15 pt-10">
                  <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                    {endLine}
                  </h2>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {pos.phase === "assigned" && others.length > 0 ? (
                      <button type="button" className="btn-ghost" onClick={goOthers}>
                        Also in your track: {others.length} more, not assigned to you
                      </button>
                    ) : null}
                    {pos.phase === "others" && mine.length > 0 ? (
                      <button type="button" className="btn-ghost" onClick={goAssigned}>
                        Back to the teams assigned to you
                      </button>
                    ) : null}
                    {backOk ? (
                      <button type="button" className="btn-ghost" onClick={goBack}>
                        Back
                      </button>
                    ) : null}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
