import { describe, expect, it } from "vitest";

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
  type Position,
} from "./stepper";
import type { Score } from "../judging/types";

const ok = { linkOpens: true, videoUnderThree: true, oneSubmission: true, startedAfterUnlock: true };
const score = (teamKey: string, over: Partial<Score> = {}): Score => ({
  judgeId: "g", teamKey, track: "build", gates: ok, recused: false, lines: [8, 8, 8, 7], total: 31,
  comment: "Twenty characters here.", clientSavedAt: "2026-09-19T19:41:00Z", savedAt: "2026-09-19T19:41:00Z", ...over,
});

const at = (index: number, over: Partial<Position> = {}): Position => ({ phase: "assigned", index, ended: false, ...over });

describe("where the judge lands on first load", () => {
  it("is the first team with no score", () => {
    const keys = ["build/a", "build/b", "build/c"];
    expect(firstUnscored(keys, { "build/a": score("build/a"), "build/b": score("build/b") })).toBe(2);
  });
  it("is the first team when every one of them is scored", () => {
    const keys = ["build/a", "build/b"];
    expect(firstUnscored(keys, { "build/a": score("build/a"), "build/b": score("build/b") })).toBe(0);
  });
  it("is the first team when none of them are", () => {
    expect(firstUnscored(["build/a", "build/b"], {})).toBe(0);
  });
});

describe("Next needs a stored score", () => {
  it("is refused on a clean card with nothing saved", () => {
    expect(canAdvance(false, null, false)).toBe(false);
  });
  it("is allowed on a clean card with a score", () => {
    expect(canAdvance(false, null, true)).toBe(true);
  });
  it("is refused while the judge is mid edit, saved or not", () => {
    expect(canAdvance(false, "edits", true)).toBe(false);
  });
  it("is refused while a save is in the air or being retried", () => {
    expect(canAdvance(false, "saving", true)).toBe(false);
    expect(canAdvance(false, "retrying", true)).toBe(false);
  });
  it("is refused until the unsent draft prompt is answered", () => {
    expect(canAdvance(false, "prompt", true)).toBe(false);
  });
  it("is allowed on everything once judging is closed", () => {
    expect(canAdvance(true, "edits", false)).toBe(true);
  });
});

describe("the lock is one lock", () => {
  it("holds Back and the pills for the same reasons it holds Next", () => {
    expect(navLocked(false, "edits")).toBe(true);
    expect(navLocked(false, "prompt")).toBe(true);
    expect(navLocked(false, null)).toBe(false);
  });
  it("never applies once judging is closed", () => {
    expect(navLocked(true, "edits")).toBe(false);
  });
  it("says what is being waited for", () => {
    expect(lockLine("edits")).toBe("Save this team before moving on.");
    expect(lockLine("prompt")).toBe("Save this team before moving on.");
    expect(lockLine("saving")).toContain("Saving");
    expect(lockLine("retrying")).toContain("kept on this device");
    expect(lockLine(null)).toBe("");
  });
});

describe("stepping through the assigned list", () => {
  it("advances one team at a time", () => {
    expect(nextPosition(at(0), 9, 9)).toEqual(at(1));
  });
  it("steps off the end of the ninth onto the end screen", () => {
    expect(nextPosition(at(8), 9, 9)).toEqual(at(8, { ended: true }));
  });
  it("goes nowhere past the end screen", () => {
    const end = at(8, { ended: true });
    expect(nextPosition(end, 9, 9)).toEqual(end);
  });
  it("comes back from the end screen onto the last team", () => {
    expect(backPosition(at(8, { ended: true }), 9, 9)).toEqual(at(8));
  });
  it("has no Back on the first team", () => {
    expect(canGoBack(at(0), 9, 9)).toBe(false);
    expect(backPosition(at(0), 9, 9)).toEqual(at(0));
  });
  it("has a Back everywhere after it", () => {
    expect(canGoBack(at(1), 9, 9)).toBe(true);
    expect(backPosition(at(1), 9, 9)).toEqual(at(0));
  });
});

describe("after the assigned list", () => {
  it("continues into the rest of the track", () => {
    expect(enterOthers(9)).toEqual({ phase: "others", index: 0, ended: false });
  });
  it("offers nothing when the track holds nothing else", () => {
    expect(enterOthers(0)).toBeNull();
  });
  it("steps back off the first unassigned team onto the end screen it came from", () => {
    const first: Position = { phase: "others", index: 0, ended: false };
    expect(canGoBack(first, 9, 9)).toBe(true);
    expect(backPosition(first, 9, 9)).toEqual({ phase: "assigned", index: 8, ended: true });
  });
  it("ends again at the bottom of the unassigned list", () => {
    const last: Position = { phase: "others", index: 8, ended: false };
    expect(nextPosition(last, 9, 9)).toEqual({ phase: "others", index: 8, ended: true });
  });
  /* A judge with nothing dealt to them in this track sees the end
     screen at once, and Back has nowhere to go. */
  it("strands nobody when the judge was dealt no teams in this track", () => {
    const empty: Position = { phase: "assigned", index: 0, ended: true };
    expect(canGoBack(empty, 0, 9)).toBe(false);
    expect(backPosition(empty, 0, 9)).toEqual(empty);
    expect(backPosition({ phase: "others", index: 0, ended: false }, 0, 9)).toEqual({ phase: "others", index: 0, ended: false });
  });
});

describe("the mark on a pill", () => {
  it("is a check and the total for a scored team", () => {
    expect(markFor(score("build/a"), false)).toEqual({ text: "✓ 31", amber: false });
  });
  it("adds up the lines when the stored total is missing", () => {
    expect(markFor(score("build/a", { total: null }), false).text).toBe("✓ 31");
  });
  it("is Recused for a team the judge sat out", () => {
    expect(markFor(score("build/a", { recused: true, lines: null, total: null }), false).text).toBe("Recused");
  });
  it("is Gate for a failed gate", () => {
    expect(markFor(score("build/a", { lines: null, total: null }), false).text).toBe("Gate");
  });
  it("is an empty circle for a team with nothing stored", () => {
    expect(markFor(undefined, false)).toEqual({ text: "○", amber: false });
  });
  it("is an amber dot while a first save is still in the air", () => {
    expect(markFor(undefined, true)).toEqual({ text: "•", amber: true });
  });
  it("keeps the marker and paints it amber when a saved team is resaving", () => {
    expect(markFor(score("build/a"), true)).toEqual({ text: "✓ 31", amber: true });
  });
});
