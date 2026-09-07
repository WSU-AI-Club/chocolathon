/* ═══════════════════════════════════════════════════════════════════
   JUDGE PAGE — every submission as a card, for the 90 minutes between
   2:15 and 3:45 on September 19.

   Reads public/judging/submissions.json, which pipeline/make-judging.mjs
   writes from the form export at 2:15 (see that file for the day-of
   steps). The rubric at the top comes from /api/hub so it is the same
   text the teams saw.

   Unlisted path, no login: the links on it are public at the finals
   ninety minutes later, and a login that can fail at 2:15 is worse than
   an unguessable URL. noindex and no-store headers are in vercel.json.

   Each judge picks their track once; the cards for that track number
   from one so a judge can say "I'm on six" out loud. Score opens the
   judge scoring form in a new tab.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";

import { JUDGE_FORM_URL } from "../content/links";
import type { Block, HubData } from "../competitor/types";
import "../chocolathon.css";

type Submission = {
  n: number;
  team: string;
  submitter: string;
  email: string;
  track: "build" | "pitch";
  prompt: string;
  promptRaw: string;
  sentence: string;
  product: string;
  video: string;
  clickFirst: string;
  repo: string;
  tested: boolean;
  notes: string;
  submittedAt: string;
};

type Judging = {
  generatedAt: string;
  sample: boolean;
  count: number;
  submissions: Submission[];
};

type State =
  | { status: "loading" }
  | { status: "ready"; judging: Judging; hub: HubData | null }
  | { status: "error"; message: string };

export default function JudgePage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [track, setTrack] = useState<"build" | "pitch">("build");

  useEffect(() => {
    document.title = "Chocolathon — Judging";
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [j, h] = await Promise.all([
          fetch("/judging/submissions.json", { cache: "no-store" }),
          fetch("/api/hub", { cache: "no-store" }).catch(() => null),
        ]);
        if (!j.ok) {
          setState({ status: "error", message: "No submissions file yet. Run make-judging and push." });
          return;
        }
        const judging = (await j.json()) as Judging;
        const hub = h && h.ok ? ((await h.json()) as HubData) : null;
        setState({ status: "ready", judging, hub });
      } catch {
        setState({ status: "error", message: "Could not load the submissions. Refresh." });
      }
    })();
  }, []);

  const rubric = useMemo(() => {
    if (state.status !== "ready" || !state.hub) return null;
    const judges = state.hub.sections.find((s) => s.id === "judges");
    if (!judges) return null;
    const want = track === "build" ? "Build Track" : "Pitch Track";
    return judges.blocks.find(
      (b): b is Extract<Block, { kind: "list" }> => b.kind === "list" && b.label.includes(want),
    ) ?? null;
  }, [state, track]);

  const promptTitle = (id: string) => {
    if (state.status !== "ready" || !state.hub) return "";
    return state.hub.prompts.find((p) => p.id === id)?.title ?? "";
  };

  return (
    <div className="choco-root min-h-screen bg-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.08] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
          <span className="label label-strong">Chocolathon · Judging</span>
          <div
            role="tablist"
            aria-label="Track"
            className="inline-flex gap-px overflow-hidden rounded-sm bg-ink/15 p-px"
          >
            {(["build", "pitch"] as const).map((t) => (
              <button
                key={t}
                role="tab"
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
          {JUDGE_FORM_URL ? (
            <a
              href={JUDGE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta !min-h-[36px] !px-4 !text-xs"
            >
              Scoring form
            </a>
          ) : (
            <span className="label">Scoring form: not set</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-24 sm:px-8">
        {state.status === "loading" ? (
          <p className="label">Loading…</p>
        ) : state.status === "error" ? (
          <p className="max-w-md text-base leading-relaxed text-ink/80">{state.message}</p>
        ) : (
          <Body
            judging={state.judging}
            track={track}
            rubric={rubric}
            promptTitle={promptTitle}
          />
        )}
      </main>
    </div>
  );
}

function Body({
  judging,
  track,
  rubric,
  promptTitle,
}: {
  judging: Judging;
  track: "build" | "pitch";
  rubric: Extract<Block, { kind: "list" }> | null;
  promptTitle: (id: string) => string;
}) {
  const shown = judging.submissions.filter((s) => s.track === track);
  const generated = new Date(judging.generatedAt);

  return (
    <>
      {judging.sample ? (
        <p className="mb-8 border-l-2 border-gold pl-4 text-base text-ink">
          <strong className="font-semibold">Rehearsal data.</strong> These are sample rows.
          The real export replaces them at 2:15 on the 19th.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          {track === "build" ? "Build Track." : "Pitch Track."}
        </h1>
        <p className="label">
          {shown.length} of {judging.count} submissions · exported{" "}
          {generated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}
        </p>
      </div>

      {rubric ? (
        <div className="mt-8 border-y border-ink/15 py-6">
          <h2 className="label">{rubric.label}</h2>
          <ol className="mt-3 grid gap-x-10 gap-y-2 sm:grid-cols-2">
            {rubric.items.map((item, i) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed text-ink/80">
                <span className="font-display w-5 shrink-0 text-lg font-semibold leading-relaxed text-goldink">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm leading-relaxed text-ink/80">
            Score every card in your track, 1 to 5 on each line, then mark advance yes or no.
            The average ranks the track; the top three advance. Ties go to Michael.
          </p>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="mt-12 text-base text-ink/80">No {track} submissions in this export.</p>
      ) : (
        <ol className="mt-4">
          {shown.map((s, i) => (
            <li key={s.n} id={`s-${s.n}`} className="border-b border-ink/15 py-10 scroll-mt-24">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-4xl font-semibold leading-none text-goldink">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                    {s.team}
                  </h2>
                  <p className="label mt-2">
                    {s.prompt || s.promptRaw}
                    {promptTitle(s.prompt) ? ` · ${promptTitle(s.prompt)}` : ""}
                  </p>
                </div>
              </div>

              {s.sentence ? (
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink">{s.sentence}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <a href={s.product} target="_blank" rel="noopener noreferrer" className="btn-cta">
                  Open the demo
                  <span aria-hidden="true">→</span>
                </a>
                <a href={s.video} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  Watch the video
                </a>
                {s.repo ? (
                  <a href={s.repo} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    Source
                  </a>
                ) : null}
                {JUDGE_FORM_URL ? (
                  <a
                    href={JUDGE_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Score this team
                  </a>
                ) : null}
              </div>

              <dl className="mt-6 grid max-w-2xl gap-x-10 gap-y-4 sm:grid-cols-2">
                {s.clickFirst ? (
                  <div>
                    <dt className="label">Click first</dt>
                    <dd className="mt-1 text-base leading-relaxed text-ink/80">{s.clickFirst}</dd>
                  </div>
                ) : null}
                {s.notes ? (
                  <div>
                    <dt className="label">To run it</dt>
                    <dd className="mt-1 text-base leading-relaxed text-ink/80">{s.notes}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="label">Submitted by</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink/80">
                    {s.submitter}
                    {s.email ? ` · ${s.email}` : ""}
                    {s.submittedAt ? ` · ${s.submittedAt}` : ""}
                    {s.tested ? "" : " · links NOT confirmed tested"}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
