/* ═══════════════════════════════════════════════════════════════════
   JUDGE PAGE — the ninety minutes between 2:00 and 3:30 on September
   19, for five judges on their own phones and laptops.

   The link carries a token (?k=…). Without it the page says one line
   and nothing else: the path is unlisted, but the token is what stops
   anyone who guessed the URL from writing scores. It is stored on the
   device on first open and stripped from the address bar, so a judge
   who reloads or shares a screenshot does not leak it.

   Then: pick your name once, work the queue Michael dealt you, watch
   each video inside the card, score four lines, write the feedback the
   team will read, Save. Saves that fail are kept on the device and
   retried; nothing is ever lost quietly (see useScores.ts).

   Three reads, all no-store: /api/judging (the published submissions),
   /api/judging-config (judges, assignments, the closed switch), and
   /api/hub (the rubric text and prompt titles, the same words the
   teams saw). Only the last one is optional.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";

import type { Block, HubData } from "../competitor/types";
import { scoreTotal, type JudgingConfig, type Score, type Track } from "../judging/types";
import type { Judging, Submission } from "./mapRows";
import ScoreCard from "./ScoreCard";
import { useScores } from "./useScores";
import "../chocolathon.css";

type Rubric = Extract<Block, { kind: "rubric" }>;

const BAD_LINK = "This link is not valid. Ask Michael for the judge link.";
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

  /* Take the token out of the address bar; it is on the device now. */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("k")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const get = async (path: string) => {
        try {
          return await fetch(path, { cache: "no-store" });
        } catch {
          return null;
        }
      };
      const [j, c, h] = await Promise.all([get("/api/judging"), get("/api/judging-config"), get("/api/hub")]);
      if (cancelled) return;

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

  const { scores, states, loadError, unauthorized, save } = useScores(judge, token);

  const closed = load.config?.closed ?? false;
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
      .map((s) => ({ ...s, teamKey: teamKeyOf(s) }))
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
  const firstUnscored = mine.find((s) => !scores[s.teamKey])?.teamKey ?? null;

  const jump = (teamKey: string) => {
    document.getElementById(`s-${teamKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    setJudge(id);
  };

  /* Nothing renders without the token, on purpose. */
  if (!token || unauthorized) {
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
                  onClick={() => setTrack(t)}
                  className={
                    "label px-4 py-2 transition-colors " +
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
              className="label underline underline-offset-4"
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
              Pick your name once. This device remembers it.
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

            <div className="mt-8 border-y border-ink/15">
              {mine.length === 0 ? (
                <p className="py-5 text-base leading-relaxed text-ink/80">
                  No teams are assigned to you in this track yet. Everything in the track is below.
                </p>
              ) : (
                <ul>
                  {mine.map((s) => {
                    const sc: Score | undefined = scores[s.teamKey];
                    const st = states[s.teamKey];
                    const amber = st && (st.kind === "retrying" || st.kind === "refused");
                    return (
                      <li key={s.teamKey} className="border-b border-ink/10 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => jump(s.teamKey)}
                          className={
                            "flex w-full items-center justify-between gap-4 px-2 py-3 text-left transition-colors hover:bg-ink/[0.04] " +
                            (s.teamKey === firstUnscored ? "bg-ink/[0.04]" : "")
                          }
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-base font-semibold leading-snug text-ink">
                              {s.team}
                            </span>
                            <span className="label">{s.prompt || s.promptRaw || "No prompt"}</span>
                          </span>
                          <span className={"label shrink-0 " + (amber ? "!text-goldink" : "label-strong")}>
                            {sc?.recused
                              ? "Recused"
                              : sc && sc.lines === null
                                ? "Gate"
                                : sc
                                  ? `✓ ${sc.total ?? scoreTotal(sc.lines) ?? ""}`
                                  : "○"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <ol className="mt-4">
              {mine.map((s) => (
                <ScoreCard
                  key={s.teamKey}
                  submission={s}
                  rubric={rubric}
                  promptTitle={promptTitle(s.prompt)}
                  score={scores[s.teamKey]}
                  state={states[s.teamKey] ?? { kind: "idle" }}
                  closed={closed}
                  judgeId={judge}
                  assigned
                  onSave={save}
                />
              ))}
            </ol>

            <details className="mt-10 border-t border-ink/15 pt-6">
              <summary className="label label-strong cursor-pointer">
                Also in your track, not assigned to you ({others.length})
              </summary>
              <ol className="mt-4">
                {others.map((s) => (
                  <ScoreCard
                    key={s.teamKey}
                    submission={s}
                    rubric={rubric}
                    promptTitle={promptTitle(s.prompt)}
                    score={scores[s.teamKey]}
                    state={states[s.teamKey] ?? { kind: "idle" }}
                    closed={closed}
                    judgeId={judge}
                    assigned={false}
                    onSave={save}
                  />
                ))}
              </ol>
            </details>
          </>
        )}
      </main>
    </div>
  );
}
