/* ═══════════════════════════════════════════════════════════════════
   ONE TEAM'S CARD — watch, score, write, save, all without leaving the
   page. Five judges use this under a ninety-minute clock, so every
   control is a real target on a phone and nothing is ever hidden: a
   disabled control keeps its paint and its place.

   The card refuses to send what the server refuses to take (api/scores):
   four lines of 1 to 10 or no lines at all, no lines when a gate failed
   or the judge recused, and twenty characters of feedback unless it is
   a recusal. Save stays disabled until the card is valid, so a judge
   never gets a red refusal for something the page could have told them.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";

import type { Block } from "../competitor/types";
import { GATE_LABELS, type Gates, type Score } from "../judging/types";
import type { Submission } from "./mapRows";
import { stampOf, type SaveInput, type SaveState } from "./useScores";
import VideoEmbed from "./VideoEmbed";

type Rubric = Extract<Block, { kind: "rubric" }>;

const GATE_KEYS = ["linkOpens", "videoUnderThree", "oneSubmission", "startedAfterUnlock"] as const;
const ALL_GATES_PASS: Gates = { linkOpens: true, videoUnderThree: true, oneSubmission: true, startedAfterUnlock: true };
const MIN_COMMENT = 20;
const TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/* Without the hub the rubric text is gone, but the four lines are not:
   a judge can still score 1 to 10 four times. Never block on the hub. */
const FALLBACK_LINES = ["Line 1", "Line 2", "Line 3", "Line 4"];

function clockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}

function sameGates(a: Gates, b: Gates): boolean {
  return GATE_KEYS.every((g) => a[g] === b[g]);
}

/* What a score amounts to in one word, for the sentence that compares
   two of them. A recusal and a failed gate carry no total, and "total
   null" is not something to show a judge at 7:30 on a Saturday. */
function figure(x: Score): string {
  if (x.recused) return "a recusal";
  if (x.total === null) return "a failed gate";
  return String(x.total);
}

export default function ScoreCard({
  submission,
  rubric,
  promptTitle,
  score,
  state,
  closed,
  judgeId,
  assigned,
  unsentDraft,
  onSave,
  onSendUnsent,
  onKeepSaved,
}: {
  submission: Submission;
  rubric: Rubric | null;
  promptTitle: string;
  score: Score | undefined;
  state: SaveState;
  closed: boolean;
  judgeId: string;
  assigned: boolean;
  /* A score this device saved and never got to send. It is not posted
     on load any more (useScores), so the card is where it surfaces. */
  unsentDraft: Score | undefined;
  onSave: (score: SaveInput) => Score | null;
  onSendUnsent: () => Score | null;
  onKeepSaved: () => void;
}) {
  const s = submission;
  const [lines, setLines] = useState<(number | null)[]>(() => score?.lines ?? [null, null, null, null]);
  const [comment, setComment] = useState(() => score?.comment ?? "");
  const [gates, setGates] = useState<Gates>(() => score?.gates ?? ALL_GATES_PASS);
  const [recused, setRecused] = useState(() => score?.recused ?? false);

  /* What the judge has typed since the last payload we sent, and the
     stamp of that payload. A Score object arrives here every time one is
     saved, retried, or adopted from the server, and an arriving object
     must never take the keyboard away from a judge mid-sentence. */
  const [dirty, setDirty] = useState(false);
  const sentAt = useRef<string | null>(null);
  const touched = () => {
    setDirty(true);
    /* Typed after Save: that payload's acknowledgement is no longer a
       description of what is on this card. */
    sentAt.current = null;
  };

  /* A save (ours or one that arrived from the server) is the only thing
     that resets the fields, and then only to what was actually stored,
     and only when the judge is not mid-edit. The one edit it does
     overwrite is the one it is the acknowledgement of. */
  useEffect(() => {
    if (!score) return;
    const mine = Boolean(sentAt.current) && score.clientSavedAt === sentAt.current;
    if (dirty && !mine) return;
    setLines(score.lines ?? [null, null, null, null]);
    setComment(score.comment);
    setGates(score.gates);
    setRecused(score.recused);
    if (mine) setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dirty is read, never a trigger
  }, [score]);

  const gateFailed = GATE_KEYS.some((g) => !gates[g]);
  const locked = closed || recused;
  const trimmed = comment.trim().length;
  const linesDone = lines.every((n) => n !== null);
  const total = linesDone ? (lines as number[]).reduce((a, b) => a + b, 0) : null;
  const valid = !locked && trimmed >= MIN_COMMENT && (gateFailed || linesDone);

  /* A different question from `dirty`: does the card differ from what is
     stored, whoever changed it. This one only paints the status line. */
  const changed = score
    ? recused !== score.recused ||
      comment !== score.comment ||
      !sameGates(gates, score.gates) ||
      JSON.stringify(lines) !== JSON.stringify(score.lines ?? [null, null, null, null])
    : lines.some((n) => n !== null) || trimmed > 0 || gateFailed || recused;

  const criteria = rubric?.items ?? null;

  const send = (over: Partial<SaveInput>) => {
    const useGates = over.gates ?? gates;
    const failed = GATE_KEYS.some((g) => !useGates[g]);
    const isRecused = over.recused ?? recused;
    const keep = !isRecused && !failed && linesDone;
    const sent = onSave({
      judgeId,
      teamKey: s.teamKey,
      track: s.track,
      gates: useGates,
      recused: isRecused,
      lines: keep ? ([...(lines as number[])] as [number, number, number, number]) : null,
      total: keep ? total : null,
      comment: isRecused ? "" : comment.trim(),
      ...over,
    });
    /* Null when the page refused the save itself (a submission with no
       team key): nothing was sent, so nothing acknowledges it. */
    sentAt.current = sent?.clientSavedAt ?? null;
  };

  const recuse = () => {
    if (!window.confirm("Record that you know this team and skip it? Your other cards are untouched.")) return;
    setRecused(true);
    /* A recusal carries no gate verdict: the judge is stepping back, not
       ruling on the entry. */
    setGates(ALL_GATES_PASS);
    send({ recused: true, gates: ALL_GATES_PASS, lines: null, total: null, comment: "" });
  };

  /* The prompt: this device is holding a score it never sent, AND the
     card is showing a different one the server already has. Stamps
     decide nothing here — they only say whether the two are the same
     payload. Judging closed is not a question to ask: neither answer
     can be acted on, so the status line says what is being kept and the
     draft is left alone. */
  const conflict = !closed && unsentDraft && score && stampOf(score) !== stampOf(unsentDraft) ? unsentDraft : null;
  /* Held for another reason (the read failed), so the card is showing
     the draft itself. Nothing to compare, but "Saved 7:10" would be a
     lie: it was never sent. Save sends it. */
  const heldQuietly = Boolean(!closed && unsentDraft && !conflict);

  const sendUnsent = () => {
    const d = unsentDraft;
    if (!d) return;
    setLines(d.lines ?? [null, null, null, null]);
    setComment(d.comment);
    setGates(d.gates);
    setRecused(d.recused);
    setDirty(false);
    const sent = onSendUnsent();
    sentAt.current = sent?.clientSavedAt ?? null;
  };

  /* One line beside Save, in priority order: what the server is doing
     now beats what the judge changed, which beats what was saved. */
  let statusText = "";
  let statusClass = "label";
  if (closed) {
    statusText = unsentDraft
      ? "Judging is closed. Your unsent score is kept on this device."
      : "Judging is closed.";
  } else if (state.kind === "saving") {
    statusText = "Saving…";
  } else if (state.kind === "retrying") {
    statusText = state.message;
    statusClass = "label !text-goldink";
  } else if (state.kind === "refused") {
    statusText = state.message;
    statusClass = "label label-alert";
  } else if (changed && score) {
    statusText = "Changed, not saved";
    statusClass = "label !text-goldink";
  } else if (heldQuietly) {
    statusText = "Not sent. Kept on this device. Save sends it.";
    statusClass = "label !text-goldink";
  } else if (state.kind === "saved") {
    statusText = `Saved ${clockTime(state.at)}`;
  } else if (score) {
    statusText = `Saved ${clockTime(score.savedAt)}`;
  }

  return (
    <li id={`s-${s.teamKey}`} className="scroll-mt-28 border-b border-ink/15 py-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">{s.team}</h2>
        {assigned ? null : <span className="label !text-goldink">Not assigned to you</span>}
      </div>
      <p className="label mt-2">
        {s.prompt || s.promptRaw || "No prompt given"}
        {promptTitle ? ` · ${promptTitle}` : ""}
      </p>
      {s.tested ? null : (
        <p className="label label-alert mt-2">The team did not confirm testing its links signed out.</p>
      )}
      {s.sentence ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink">{s.sentence}</p> : null}

      <VideoEmbed url={s.video} team={s.team} />

      <div className="mt-5 flex flex-wrap gap-3">
        {s.product ? (
          <a
            href={s.product}
            target="_blank"
            rel="noopener noreferrer"
            className={s.video ? "btn-cta" : "btn-ghost"}
          >
            Open the demo
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
        {s.repo ? (
          <a href={s.repo} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Source
          </a>
        ) : null}
      </div>

      {s.clickFirst || s.notes ? (
        <dl className="mt-6 grid max-w-2xl gap-x-10 gap-y-4 sm:grid-cols-2">
          {s.clickFirst ? (
            <div>
              <dt className="label">What to click first</dt>
              <dd className="mt-1 text-base leading-relaxed text-ink/80">{s.clickFirst}</dd>
            </div>
          ) : null}
          {s.notes ? (
            <div>
              <dt className="label">From the team</dt>
              <dd className="mt-1 text-base leading-relaxed text-ink/80">{s.notes}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {/* ── the four lines ─────────────────────────────────────────── */}
      <div className="mt-8 border-t border-ink/15">
        {FALLBACK_LINES.map((fallback, i) => {
          const c = criteria?.[i];
          return (
            <fieldset key={i} className="border-b border-ink/10 py-5">
              <legend className="flex gap-3 font-display text-xl font-semibold leading-snug tracking-tight text-ink">
                <span className="w-5 shrink-0 text-goldink">{i + 1}</span>
                <span>{c ? c.name : fallback}</span>
              </legend>
              {c ? (
                <p className="mt-2 max-w-2xl text-sm leading-snug text-ink/80">
                  <span className="font-semibold">1</span> {c.low} <span className="font-semibold">· 5</span> {c.mid}{" "}
                  <span className="font-semibold">· 10</span> {c.high}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TEN.map((n) => {
                  const on = lines[i] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${c ? c.name : fallback}: ${n}`}
                      disabled={locked || gateFailed}
                      onClick={() => {
                        touched();
                        setLines((prev) => prev.map((v, k) => (k === i ? n : v)));
                      }}
                      className={
                        "label inline-flex h-10 w-10 items-center justify-center rounded-sm border tabular-nums transition-colors disabled:cursor-not-allowed " +
                        (on
                          ? "border-ink bg-ink !text-white"
                          : "border-ink/25 bg-white hover:border-ink/60 hover:bg-ink/[0.04]")
                      }
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
        <p className="label mt-4">
          {gateFailed
            ? "A gate failed, so this team is not scored."
            : total === null
              ? "Total — of 40"
              : `Total ${total} of 40`}
        </p>
      </div>

      {/* ── feedback ───────────────────────────────────────────────── */}
      <div className="mt-8 max-w-2xl">
        <label htmlFor={`c-${s.teamKey}`} className="label label-strong block">
          {gateFailed ? "Say which gate failed and why. The team is told." : "Feedback for the team. They will read this."}
        </label>
        <textarea
          id={`c-${s.teamKey}`}
          value={comment}
          disabled={locked}
          rows={4}
          onChange={(e) => {
            touched();
            setComment(e.target.value);
          }}
          className="mt-2 w-full rounded-sm border border-ink/25 bg-white p-3 text-base leading-relaxed text-ink disabled:bg-ink/[0.03]"
        />
        <p className={"label mt-1 " + (trimmed < MIN_COMMENT ? "!text-goldink" : "")}>
          {trimmed < MIN_COMMENT ? `${trimmed} of ${MIN_COMMENT} characters minimum` : `${trimmed} characters`}
        </p>
      </div>

      {/* ── gates ──────────────────────────────────────────────────── */}
      <div className="mt-6 max-w-2xl">
        <p className="label label-strong">All four are true unless you say otherwise.</p>
        <ul className="mt-2 space-y-2">
          {GATE_KEYS.map((g) => (
            <li key={g}>
              <label className="flex items-start gap-3 text-base leading-relaxed text-ink">
                <input
                  type="checkbox"
                  checked={gates[g]}
                  disabled={locked}
                  onChange={(e) => {
                    touched();
                    setGates((prev) => ({ ...prev, [g]: e.target.checked }));
                  }}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#232a4d]"
                />
                <span>{GATE_LABELS[g]}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* ── recusal ────────────────────────────────────────────────── */}
      <div className="mt-6">
        {recused ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="label label-strong">You sat this one out.</span>
            <button
              type="button"
              className="btn-ghost-sm"
              disabled={closed}
              onClick={() => {
                touched();
                setRecused(false);
              }}
            >
              I can judge this after all
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost-sm" disabled={closed} onClick={recuse}>
            I know this team, skip it
          </button>
        )}
      </div>

      {/* ── an unsent score from this device ───────────────────────── */}
      {conflict && score ? (
        <div className="mt-6 max-w-2xl">
          <p className="label label-alert">
            {`This device has an unsent score for this team (${
              conflict.recused || conflict.total === null ? figure(conflict) : `total ${conflict.total}`
            }, from ${clockTime(stampOf(conflict))}). The saved score is ${figure(score)} from ${clockTime(score.savedAt)}.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className="btn-ghost-sm" onClick={sendUnsent}>
              Send the unsent one
            </button>
            <button type="button" className="btn-ghost-sm" onClick={onKeepSaved}>
              Keep the saved one
            </button>
          </div>
        </div>
      ) : null}

      {/* ── save ───────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn-cta"
          disabled={!valid}
          style={closed ? { visibility: "hidden" } : undefined}
          onClick={() => send({})}
        >
          Save
        </button>
        <span className={statusClass}>{statusText}</span>
      </div>
    </li>
  );
}
