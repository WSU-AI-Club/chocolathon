import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildWorkbook, workbookFileName } from "./exportXlsx";
import type { TeamRow } from "./ranking";
import type { JudgingConfig, Score } from "./types";

const ok = { linkOpens: true, videoUnderThree: true, oneSubmission: true, startedAfterUnlock: true };
const s = (judgeId: string, lines: [number, number, number, number] | null, extra: Partial<Score> = {}): Score => ({
  judgeId, teamKey: "build/alpha", track: "build", gates: ok, recused: false, lines, total: lines ? lines.reduce((a, b) => a + b, 0) : null,
  comment: "Clear demo, thin on limits.", savedAt: "2026-09-19T19:10:00Z", ...extra,
});
const config: JudgingConfig = { judges: [{ id: "g", name: "Grant Johnson", tracks: "build" }, { id: "d", name: "Dane Laughlin", tracks: "build" }], minPerTeam: 2, assignments: {}, excluded: [], closed: true };
const row: TeamRow = {
  teamKey: "build/alpha", team: "Alpha", track: "build", prompt: "B-0",
  scores: [s("g", [8, 7, 9, 6]), s("d", null, { recused: true })], counted: [s("g", [8, 7, 9, 6])], judgeCount: 1,
  mean: 30, meanLine1: 8, meanLine2: 7, medianTotal: 30, rank: 1, finalist: true, flags: ["Under two judges"], excluded: false,
};

describe("buildWorkbook", () => {
  const wb = buildWorkbook({ rows: [row], config, exportedAt: new Date("2026-09-19T20:32:00Z") });
  const sheet = (name: string) => XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1 });

  it("has the three sheets in order", () => {
    expect(wb.SheetNames).toEqual(["Ranking", "All scores", "Feedback for teams"]);
  });
  it("ranking row", () => {
    const [h, r] = sheet("Ranking");
    expect(h).toEqual(["Track", "Rank", "Team", "Prompt", "Mean total", "Judges", "Mean line 1", "Mean line 2", "Median total", "Finalist", "Flags"]);
    expect(r).toEqual(["Build", 1, "Alpha", "B-0", 30, 1, 8, 7, 30, "Yes", "Under two judges"]);
  });
  it("all scores names judges and includes the recusal", () => {
    const rows = sheet("All scores");
    expect(rows[1]).toEqual(["Build", "Alpha", "Grant Johnson", 8, 7, 9, 6, 30, "4 of 4", "", "Clear demo, thin on limits.", "2026-09-19T19:10:00Z"]);
    expect(rows[2][2]).toBe("Dane Laughlin");
    expect(rows[2][9]).toBe("Yes");
  });
  it("feedback sheet uses letters and drops recusals", () => {
    const rows = sheet("Feedback for teams");
    expect(rows[0]).toEqual(["Track", "Team", "Judge", "Line 1", "Line 2", "Line 3", "Line 4", "Total", "Comment"]);
    expect(rows).toHaveLength(2);
    expect(rows[1][2]).toBe("Judge A");
    expect(JSON.stringify(rows)).not.toContain("Grant");
  });
});

it("workbookFileName is Wichita time", () => {
  expect(workbookFileName(new Date("2026-09-19T20:32:00Z"))).toBe("chocolathon-judging-2026-09-19-1532.xlsx");
});
