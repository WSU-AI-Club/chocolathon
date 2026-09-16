/* Three sheets: the ranking Michael reads, every score with judge names
   for the record, and the team-facing sheet with judges as letters. A
   snapshot of what is saved when pressed; the ranking page's flags are
   the pre-flight. */
import * as XLSX from "xlsx";
import type { TeamRow } from "./ranking";
import type { JudgingConfig, Score } from "./types";

export type ExportInput = { rows: TeamRow[]; config: JudgingConfig; exportedAt: Date };

const r2 = (n: number | null) => (n === null ? "" : Math.round(n * 100) / 100);
const trackName = (t: string) => (t === "build" ? "Build" : "Pitch");
const gatesPassed = (s: Score) => `${Object.values(s.gates).filter(Boolean).length} of 4`;
const letter = (i: number) => `Judge ${String.fromCharCode(65 + i)}`;

export function buildWorkbook({ rows, config, exportedAt }: ExportInput): XLSX.WorkBook {
  const name = (id: string) => config.judges.find((j) => j.id === id)?.name ?? id;
  const ordered = [...rows].sort((a, b) => (a.track === b.track ? (a.rank ?? 999) - (b.rank ?? 999) : a.track === "build" ? -1 : 1));

  const ranking = [["Track", "Rank", "Team", "Prompt", "Mean total", "Judges", "Mean line 1", "Mean line 2", "Median total", "Finalist", "Flags"],
    ...ordered.map((r) => [trackName(r.track), r.rank ?? "", r.team, r.prompt, r2(r.mean), r.judgeCount, r2(r.meanLine1), r2(r.meanLine2), r2(r.medianTotal), r.finalist ? "Yes" : "", r.flags.join("; ")])];

  const all = [["Track", "Team", "Judge", "Line 1", "Line 2", "Line 3", "Line 4", "Total", "Gates passed", "Recused", "Comment", "Saved at"]];
  const feedback = [["Track", "Team", "Judge", "Line 1", "Line 2", "Line 3", "Line 4", "Total", "Comment"]];
  for (const r of ordered) {
    const byTime = [...r.scores].sort((a, b) => a.savedAt.localeCompare(b.savedAt));
    byTime.forEach((s) => all.push([trackName(r.track), r.team, name(s.judgeId), ...(s.lines ?? ["", "", "", ""]), s.total ?? "", gatesPassed(s), s.recused ? "Yes" : "", s.comment, s.savedAt] as never));
    byTime.filter((s) => !s.recused).forEach((s, i) => feedback.push([trackName(r.track), r.team, letter(i), ...(s.lines ?? ["", "", "", ""]), s.total ?? "", s.comment] as never));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ranking), "Ranking");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(all), "All scores");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(feedback), "Feedback for teams");
  wb.Props = { Title: "Chocolathon judging", CreatedDate: exportedAt };
  return wb;
}

export function workbookFileName(exportedAt: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(exportedAt);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `chocolathon-judging-${g("year")}-${g("month")}-${g("day")}-${g("hour")}${g("minute")}.xlsx`;
}

export function downloadWorkbook(input: ExportInput): void {
  XLSX.writeFile(buildWorkbook(input), workbookFileName(input.exportedAt));
}
