import { describe, expect, it } from "vitest";
import { draftKey, mergeScores, shouldRetry } from "./useScores";
import type { Score } from "../judging/types";

const ok = { linkOpens: true, videoUnderThree: true, oneSubmission: true, startedAfterUnlock: true };
const s = (teamKey: string, savedAt: string, total = 20): Score => ({ judgeId: "g", teamKey, track: "build", gates: ok, recused: false, lines: [5, 5, 5, 5], total, comment: "Twenty characters here.", savedAt });

describe("useScores helpers", () => {
  it("draftKey", () => { expect(draftKey("grant-johnson", "build/alpha")).toBe("choco-draft:grant-johnson:build/alpha"); });
  it("mergeScores lets a newer draft win", () => {
    const merged = mergeScores([s("build/a", "2026-09-19T19:00:00Z", 20), s("build/b", "2026-09-19T19:00:00Z")], [s("build/a", "2026-09-19T19:05:00Z", 24), s("build/c", "2026-09-19T19:01:00Z")]);
    expect(merged["build/a"].total).toBe(24);
    expect(merged["build/b"].total).toBe(20);
    expect(merged["build/c"]).toBeDefined();
  });
  it("mergeScores keeps the server copy when it is newer", () => {
    const merged = mergeScores([s("build/a", "2026-09-19T19:10:00Z", 20)], [s("build/a", "2026-09-19T19:05:00Z", 24)]);
    expect(merged["build/a"].total).toBe(20);
  });
  it("shouldRetry", () => {
    expect([null, 0, 500, 502, 408, 429].map(shouldRetry)).toEqual([true, true, true, true, true, true]);
    expect([200, 400, 401, 404, 409, 423].map(shouldRetry)).toEqual([false, false, false, false, false, false]);
  });
});
