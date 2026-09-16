/* ═══════════════════════════════════════════════════════════════════
   THE STEPPER — which one team is on the screen, and whether the judge
   is allowed to leave it.

   Michael watched the live page on the 15th and asked for one team at a
   time: nine cards stacked down a page meant nine iframes loading at
   once on a phone, and a judge who could scroll past a card they had
   not saved. So the page now mounts exactly one card, and this file
   holds the two decisions that go with that.

   WHERE AM I — a Position: which list (the teams Michael dealt this
   judge, or the rest of the track they can pick up when they finish),
   how far down it, and whether they have stepped off the end of it.

   MAY I LEAVE — a NavReason. Null means the card on the screen is
   exactly what the server holds, so Back, Next and every pill work.
   Anything else is unsaved work: the judge typed since the last save,
   a save is in the air, a save is being retried, or this device is
   holding a draft it never sent and the judge has not said which score
   they meant. Next needs one thing more than the others: a score
   actually stored for this team, because Next is the button that says
   "this one is done".

   None of it applies once judging is closed. Then there is nothing to
   save and the whole track is there to read.
   ═══════════════════════════════════════════════════════════════════ */

import { scoreTotal, type Score } from "../judging/types";

export type Phase = "assigned" | "others";
export type Position = { phase: Phase; index: number; ended: boolean };

export type NavReason = "edits" | "saving" | "retrying" | "prompt" | null;

/* The sentence under the control row. "Save this team" is the honest
   instruction for work the judge has to act on; a save the page is
   handling by itself says so instead, so nobody presses Save at a
   button that is already doing the thing. */
export function lockLine(reason: NavReason): string {
  if (reason === "saving") return "Saving. One moment.";
  if (reason === "retrying") return "Not saved yet. The draft is kept on this device and sent again.";
  if (reason === "prompt" || reason === "edits") return "Save this team before moving on.";
  return "";
}

export const listLength = (pos: Position, mineLen: number, othersLen: number): number =>
  pos.phase === "assigned" ? mineLen : othersLen;

/* Back, Next and the pills are one lock: a judge who cannot leave by
   the button must not leave by the strip either. */
export function navLocked(closed: boolean, reason: NavReason): boolean {
  return !closed && reason !== null;
}

/* Next is the only control that also asks whether this team is stored.
   `saved` is the page's word for "the server holds a score from this
   judge for this team", and a recusal and a failed gate are both
   scores. Closed judging is read-only browsing: everything moves. */
export function canAdvance(closed: boolean, reason: NavReason, saved: boolean): boolean {
  if (closed) return true;
  return reason === null && saved;
}

export function canGoBack(pos: Position, mineLen: number, othersLen: number): boolean {
  const len = listLength(pos, mineLen, othersLen);
  if (pos.ended) return len > 0;
  if (pos.index > 0) return true;
  /* The first of the unassigned teams steps back onto the end screen
     of the assigned list, which is where the judge came from. */
  return pos.phase === "others" && mineLen > 0;
}

export function nextPosition(pos: Position, mineLen: number, othersLen: number): Position {
  const len = listLength(pos, mineLen, othersLen);
  if (pos.ended) return pos;
  if (pos.index < len - 1) return { ...pos, index: pos.index + 1 };
  return { ...pos, ended: true };
}

export function backPosition(pos: Position, mineLen: number, othersLen: number): Position {
  const len = listLength(pos, mineLen, othersLen);
  if (pos.ended) return len > 0 ? { ...pos, ended: false, index: len - 1 } : pos;
  if (pos.index > 0) return { ...pos, index: pos.index - 1 };
  if (pos.phase === "others" && mineLen > 0) return { phase: "assigned", index: mineLen - 1, ended: true };
  return pos;
}

/* The end screen's one button. */
export function enterOthers(othersLen: number): Position | null {
  return othersLen > 0 ? { phase: "others", index: 0, ended: false } : null;
}

/* Where the judge lands when they arrive: the first team Michael dealt
   them that has no score yet, or the first team when every one of them
   is done. */
export function firstUnscored(keys: string[], scores: Record<string, Score>): number {
  const i = keys.findIndex((k) => !scores[k]);
  return i < 0 ? 0 : i;
}

/* The marker on a pill, the same four the queue rows carried: a check
   with the total, a recusal, a failed gate, an empty circle. Amber is
   a save that has not landed yet, and on a team with nothing stored it
   is all there is to show, so it gets the dot. */
export type Mark = { text: string; amber: boolean };

export function markFor(score: Score | undefined, amber: boolean): Mark {
  if (score?.recused) return { text: "Recused", amber };
  if (score && score.lines === null) return { text: "Gate", amber };
  if (score) return { text: `✓ ${score.total ?? scoreTotal(score.lines) ?? ""}`, amber };
  return { text: amber ? "•" : "○", amber };
}
