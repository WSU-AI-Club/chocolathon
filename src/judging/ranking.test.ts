import { describe, expect, it } from "vitest";
import { rankTrack } from "./ranking";
import type { JudgingConfig, Score } from "./types";
import type { Submission } from "../judge/mapRows";

const sub = (team: string, track: "build" | "pitch" = "build"): Submission => ({
  n: 1, team, teamKey: `${track}/${team.toLowerCase()}`, submitter: "", email: "", track, prompt: "B-0", promptRaw: "B-0",
  sentence: "", product: "https://x.test", video: "https://youtu.be/abcdefgh", clickFirst: "", repo: "", tested: true, notes: "", submittedAt: "",
});
const ok = { linkOpens: true, videoUnderThree: true, oneSubmission: true, startedAfterUnlock: true };
const score = (judgeId: string, team: string, lines: [number, number, number, number] | null, extra: Partial<Score> = {}): Score => ({
  judgeId, teamKey: `build/${team.toLowerCase()}`, track: "build", gates: ok, recused: false,
  lines, total: lines ? lines.reduce((a, b) => a + b, 0) : null, comment: "Fine work all round.", savedAt: "2026-09-19T19:00:00Z", ...extra,
});
const config: JudgingConfig = { judges: [{ id: "g", name: "Grant Johnson", tracks: "build" }, { id: "d", name: "Dane Laughlin", tracks: "build" }, { id: "f", name: "Fareeha Amber Ansari", tracks: "build" }], minPerTeam: 2, assignments: {}, excluded: [], closed: false };
const name = (id: string) => config.judges.find((j) => j.id === id)?.name ?? id;

describe("rankTrack", () => {
  it("orders by mean total and numbers ranks", () => {
    const subs = [sub("Alpha"), sub("Beta"), sub("Gamma")];
    const scores = [score("g", "Alpha", [8, 8, 8, 8]), score("d", "Alpha", [6, 6, 6, 6]),
      score("g", "Beta", [9, 9, 9, 9]), score("d", "Beta", [9, 9, 9, 9]),
      score("g", "Gamma", [5, 5, 5, 5]), score("d", "Gamma", [5, 5, 5, 5])];
    const rows = rankTrack("build", subs, scores, config, name);
    expect(rows.map((r) => [r.team, r.rank, r.mean])).toEqual([["Beta", 1, 36], ["Alpha", 2, 28], ["Gamma", 3, 20]]);
    expect(rows.every((r) => r.finalist)).toBe(true);
  });

  it("breaks ties on line 1, then line 2, then median", () => {
    const subs = [sub("Alpha"), sub("Beta"), sub("Gamma")];
    const scores = [
      score("g", "Alpha", [9, 5, 8, 8]), score("d", "Alpha", [9, 5, 8, 8]),   // mean 30, line1 9, line2 5
      score("g", "Beta", [8, 6, 8, 8]), score("d", "Beta", [8, 6, 8, 8]),     // mean 30, line1 8
      score("g", "Gamma", [9, 6, 7, 8]), score("d", "Gamma", [9, 6, 7, 8]),   // mean 30, line1 9, line2 6
    ];
    const rows = rankTrack("build", subs, scores, config, name);
    expect(rows.map((r) => r.team)).toEqual(["Gamma", "Alpha", "Beta"]);
  });

  it("stretches the finalist line to four on a tie at third, flags a three-way tie", () => {
    const subs = ["A", "B", "C", "D", "E"].map((t) => sub(t));
    const base: Record<string, [number, number, number, number]> = { A: [10, 10, 10, 10], B: [9, 9, 9, 9], C: [7, 7, 7, 7], D: [7, 7, 7, 7], E: [5, 5, 5, 5] };
    const scores = Object.entries(base).flatMap(([t, l]) => [score("g", t, l), score("d", t, l)]);
    const rows = rankTrack("build", subs, scores, config, name);
    expect(rows.filter((r) => r.finalist).map((r) => r.team)).toEqual(["A", "B", "C", "D"]);

    // Five teams where C, D and E all score the same (28 each): finalists
    // are exactly A and B, and C, D, E carry the tie flag (rewritten
    // plainly per the plan's Step 4 note; the original inline mutation
    // of `scores` produced an ambiguous fixture).
    const threeWayScores = [
      score("g", "A", [10, 10, 10, 10]), score("d", "A", [10, 10, 10, 10]),
      score("g", "B", [9, 9, 9, 9]), score("d", "B", [9, 9, 9, 9]),
      score("g", "C", [7, 7, 7, 7]), score("d", "C", [7, 7, 7, 7]),
      score("g", "D", [7, 7, 7, 7]), score("d", "D", [7, 7, 7, 7]),
      score("g", "E", [7, 7, 7, 7]), score("d", "E", [7, 7, 7, 7]),
    ];
    const three = rankTrack("build", subs, threeWayScores, config, name);
    expect(three.filter((r) => r.finalist).map((r) => r.team)).toEqual(["A", "B"]);
    expect(three.find((r) => r.team === "C")!.flags).toContain("Tie at the cut: leadership decides");
    expect(three.find((r) => r.team === "D")!.flags).toContain("Tie at the cut: leadership decides");
    expect(three.find((r) => r.team === "E")!.flags).toContain("Tie at the cut: leadership decides");
  });

  it("ignores recused scores, flags under two judges and recusals", () => {
    const subs = [sub("Alpha")];
    const scores = [score("g", "Alpha", [8, 8, 8, 8]), score("d", "Alpha", null, { recused: true })];
    const [row] = rankTrack("build", subs, scores, config, name);
    expect(row.judgeCount).toBe(1);
    expect(row.mean).toBe(32);
    expect(row.flags).toContain("Under two judges");
    expect(row.flags).toContain("Recused: Dane Laughlin");
  });

  it("flags a failed gate with its label and the judge, and drops excluded teams below", () => {
    const subs = [sub("Alpha"), sub("Beta")];
    const scores = [score("g", "Alpha", null, { gates: { ...ok, videoUnderThree: false } }), score("d", "Alpha", [6, 6, 6, 6]),
      score("g", "Beta", [7, 7, 7, 7]), score("d", "Beta", [7, 7, 7, 7])];
    const rows = rankTrack("build", subs, scores, { ...config, excluded: ["build/alpha"] }, name);
    expect(rows.map((r) => r.team)).toEqual(["Beta", "Alpha"]);
    expect(rows[1].excluded).toBe(true);
    expect(rows[1].rank).toBeNull();
    expect(rows[1].flags).toContain("Gate failed: The video is three minutes or less. (Grant Johnson)");
  });

  it("puts unscored teams last with no rank", () => {
    const subs = [sub("Alpha"), sub("Beta")];
    const rows = rankTrack("build", subs, [score("g", "Beta", [5, 5, 5, 5]), score("d", "Beta", [5, 5, 5, 5])], config, name);
    expect(rows.map((r) => [r.team, r.rank])).toEqual([["Beta", 1], ["Alpha", null]]);
  });

  it("flags a team that is also entered in the other track", () => {
    const subs = [{ ...sub("Alpha"), alsoIn: "pitch" as const }];
    const scores = [score("g", "Alpha", [8, 8, 8, 8]), score("d", "Alpha", [8, 8, 8, 8])];
    const [row] = rankTrack("build", subs, scores, config, name);
    expect(row.flags).toContain("Also entered in the pitch track");
  });
});
