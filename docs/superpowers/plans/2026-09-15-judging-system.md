# Judging System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Between 2:00 and 3:30 PM on 2026-09-19, five or six judges score every team's submission inside the site, each team gets at least two judges, Michael watches a live ranking and exports an Excel file, and nothing depends on a Microsoft form or a hand tally.

**Architecture:** Pure, tested modules in `src/judging/` (embed parser, dealer, ranking math, Excel export) shared by three unlisted React pages (upload, judge, ranking) that run through the existing pathname switch in `src/App.tsx`. Two new Vercel functions (`api/judging-config.ts`, `api/scores.ts`) store JSON in the private Vercel Blob store already connected; one file per judge per team so concurrent saves never collide. No accounts: the upload key gates Michael's writes, a judge token in the link gates score writes.

**Tech Stack:** Vite 5 + React 18 + TypeScript, Tailwind classes plus the site's own `.label / .eyebrow / .btn-cta / .btn-ghost / .btn-ghost-sm` classes in `src/chocolathon.css`, `xlsx` (SheetJS, already a dependency) for read and write, `@vercel/blob` (already a dependency), Vitest (added by Task 1), Vercel serverless functions under `api/` with `@vercel/node` types.

**Spec:** `C:/Users/goldm/OneDrive/Founder-OS/01-projects/Chocolathon/chocolathon-judging-spec.md` (approved 2026-09-15). Read it first; every task below argues from it.

## Global Constraints

- `package.json` has `"type": "module"`. **Every relative import inside `api/` must carry a `.js` extension** (`import { x } from "./_blob.js"`), or production returns 500 while `vercel dev` passes. Existing `api/hub.ts` and `api/judging.ts` show the pattern.
- `api/` files never import from `src/`, and `src/` never imports `api/_content.ts` (prompt text must not reach the client bundle). Types the client needs are duplicated in `src/competitor/types.ts` and `src/judging/types.ts`.
- Every API response sets `Cache-Control: no-store, private`. Blob reads use `{ access: "private", useCache: false }`. Blob writes use `{ access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" }`.
- No em dashes in any user-facing copy. Sentences, not labels with colons, in judge-facing text.
- Nothing hidden by unmounting when a state changes what is shown: keep elements in the DOM and toggle paint where the existing pages do (the judge page comment "Nothing hidden" in the spec §6).
- Unlisted pages set `<meta name="robots" content="noindex, nofollow">` in an effect, as `UploadPage.tsx` does.
- Rehearsal data never carries a real prompt title beyond ids that are already public; team names in fixtures are fictional.
- Commit after every task with a message that ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. No double quotes inside commit messages (PowerShell trap). Never push; Michael pushes on a yes.
- Verify with `npm test` and `npm run build` (runs `tsc -b && vite build`) before every commit.
- Existing judge ids, names, and paths: `JUDGE_PATH = "/judge-c7m2x9"`, `UPLOAD_PATH = "/upload-k4n8pq"` in `src/content/links.ts`. Add `RESULTS_PATH = "/results-m3v8tq"` there in Task 9.

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/judge/mapRows.ts` (+test, fixture) | export → submissions, `teamKey`, duplicates, warnings | 1 (done by a worker) |
| `src/judging/types.ts` | `Judge`, `JudgingConfig`, `Score`, `Gates`, `TeamRow` types shared by pages | 2 |
| `src/judging/embed.ts` (+test) | video URL → iframe source | 2 |
| `src/judging/dealer.ts` (+test) | assign judges to teams | 3 |
| `src/judging/ranking.ts` (+test) | totals, means, order, tie-breaks, finalist line, flags | 4 |
| `src/judging/exportXlsx.ts` (+test) | three-sheet workbook | 5 |
| `api/_blob.ts` | read/write/list JSON in the private store | 6 |
| `api/_auth.ts` | upload-key and judge-token checks | 6 |
| `api/judging-config.ts` | GET/POST config | 6 |
| `api/scores.ts` | GET (judge / all), POST, DELETE | 6 |
| `src/upload/UploadPage.tsx` | + assignment panel, close switch, clear scores | 7 |
| `src/upload/AssignmentPanel.tsx` | the panel itself | 7 |
| `src/judge/JudgePage.tsx` | rewritten: token, picker, queue, cards | 8 |
| `src/judge/ScoreCard.tsx` | one team's card with embed and scoring | 8 |
| `src/judge/useScores.ts` | load, save, retry, local drafts | 8 |
| `src/results/ResultsPage.tsx` | ranking, flags, export, exclude, close | 9 |
| `src/App.tsx`, `src/content/links.ts` | route + path | 9 |
| `pipeline/make-rehearsal.mjs` | 30-team fictional .xlsx with the real headers | 10 |

---

### Task 1: Column mapping against the real export (done by a worker, 2026-09-15)

Already implemented in a separate worker run; listed so later tasks know its interface. Confirm with `npm test` that `src/judge/mapRows.test.ts` passes before starting Task 2.

**Produces (in `src/judge/mapRows.ts`):**
```ts
export type Submission = {
  n: number; team: string; teamKey: string; duplicateOf?: number;
  submitter: string; email: string; track: "build" | "pitch";
  prompt: string; promptRaw: string; sentence: string; product: string; video: string;
  clickFirst: string; repo: string; tested: boolean; notes: string; submittedAt: string;
};
export type Judging = { generatedAt: string; publishedAt?: string; source: string; sample: boolean; count: number; submissions: Submission[] };
export function mapRows(header: string[], rows: string[][], source: string):
  { judging: Judging; missing: string[]; dropped: Submission[]; warnings: string[]; optionalMissing: string[] };
export function teamKey(track: "build" | "pitch", team: string): string;   // "pitch/sugar-is-sweet"
```
Fixture: `src/judge/__fixtures__/forms-export-2026-09-15.ts` exports `HEADER: string[]` and `ROWS: string[][]`.

If the worker named anything differently, adapt the later tasks to the worker's names rather than renaming its code.

---

### Task 2: Shared types and the video embed parser

**Files:**
- Create: `src/judging/types.ts`
- Create: `src/judging/embed.ts`
- Test: `src/judging/embed.test.ts`

**Produces:**
```ts
// src/judging/types.ts
export type Track = "build" | "pitch";
export type JudgeTracks = "build" | "pitch" | "both" | "off";
export type Judge = { id: string; name: string; tracks: JudgeTracks };
export type JudgingConfig = {
  judges: Judge[];
  minPerTeam: number;
  assignments: Record<string, string[]>;   // teamKey -> judgeIds
  excluded: string[];                      // teamKeys Michael dropped after a gate failure
  closed: boolean;
  publishedAt?: string;
};
export type Gates = { linkOpens: boolean; videoUnderThree: boolean; oneSubmission: boolean; startedAfterUnlock: boolean };
export type Score = {
  judgeId: string; teamKey: string; track: Track;
  gates: Gates; recused: boolean;
  lines: [number, number, number, number] | null;
  total: number | null;
  comment: string;
  savedAt: string;
};
export const GATE_LABELS: Record<keyof Gates, string> = {
  linkOpens: "The link opens without a login or an install.",
  videoUnderThree: "The video is three minutes or less.",
  oneSubmission: "One submission from this team, in one track.",
  startedAfterUnlock: "The work started after the prompts unlocked.",
};
export function judgeId(name: string): string;   // "Fareeha Amber Ansari" -> "fareeha-amber-ansari"
export function scoreTotal(lines: Score["lines"]): number | null;   // sum, or null
```
```ts
// src/judging/embed.ts
export type Embed = { kind: "youtube" | "vimeo" | "drive" | "loom"; src: string };
export function videoEmbed(url: string): Embed | null;
```

- [ ] **Step 1: Write `src/judging/types.ts`** with the types above and these two functions:

```ts
export function judgeId(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
export function scoreTotal(lines: Score["lines"]): number | null {
  return lines ? lines.reduce((a, b) => a + b, 0) : null;
}
```

- [ ] **Step 2: Write the failing embed tests** in `src/judging/embed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { videoEmbed } from "./embed";

describe("videoEmbed", () => {
  it.each([
    ["https://youtu.be/JWhICz1QR8M?is=8YoLJSXG6nEfL5hn", "youtube", "https://www.youtube-nocookie.com/embed/JWhICz1QR8M"],
    ["https://www.youtube.com/watch?v=Aq5WXmQQooo&t=10s", "youtube", "https://www.youtube-nocookie.com/embed/Aq5WXmQQooo"],
    ["https://youtube.com/shorts/Aq5WXmQQooo", "youtube", "https://www.youtube-nocookie.com/embed/Aq5WXmQQooo"],
    ["https://m.youtube.com/watch?v=Aq5WXmQQooo", "youtube", "https://www.youtube-nocookie.com/embed/Aq5WXmQQooo"],
    ["https://vimeo.com/123456789", "vimeo", "https://player.vimeo.com/video/123456789"],
    ["https://vimeo.com/123456789/abcdef1234", "vimeo", "https://player.vimeo.com/video/123456789?h=abcdef1234"],
    ["https://drive.google.com/file/d/1AbC_dEf-GhI/view?usp=sharing", "drive", "https://drive.google.com/file/d/1AbC_dEf-GhI/preview"],
    ["https://drive.google.com/open?id=1AbC_dEf-GhI", "drive", "https://drive.google.com/file/d/1AbC_dEf-GhI/preview"],
    ["https://www.loom.com/share/0abc123def4567890abc123def456789", "loom", "https://www.loom.com/embed/0abc123def4567890abc123def456789"],
  ])("%s", (url, kind, src) => {
    expect(videoEmbed(url)).toEqual({ kind, src });
  });

  it.each([
    "https://wichitastate-my.sharepoint.com/:v:/g/personal/x/abc",
    "https://1drv.ms/v/s!abc",
    "Trat",
    "",
    "https://example.com/video.mp4",
    "https://www.youtube.com/",
  ])("no embed for %s", (url) => {
    expect(videoEmbed(url)).toBeNull();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run src/judging/embed.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `src/judging/embed.ts`**

```ts
/* Turn the video link a team pasted into something an iframe can show.
   Four hosts embed cleanly; everything else returns null and the card
   falls back to a button. Never throws on garbage. */
import type { Embed } from "./types";
export type { Embed };

export function videoEmbed(raw: string): Embed | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
  const id = (s: string | null | undefined) => (s && /^[\w-]{6,}$/.test(s) ? s : null);

  if (host === "youtu.be") {
    const v = id(u.pathname.split("/")[1]);
    return v ? { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${v}` } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const v = id(u.searchParams.get("v")) ?? (["shorts", "embed", "live"].includes(parts[0]) ? id(parts[1]) : null);
    return v ? { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${v}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const num = parts.find((p) => /^\d{6,}$/.test(p));
    if (!num) return null;
    const hash = parts[parts.indexOf(num) + 1];
    const h = hash && /^[a-f0-9]{6,}$/i.test(hash) ? `?h=${hash}` : "";
    return { kind: "vimeo", src: `https://player.vimeo.com/video/${num}${h}` };
  }
  if (host === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([\w-]+)/);
    const fid = id(m?.[1]) ?? id(u.searchParams.get("id"));
    return fid ? { kind: "drive", src: `https://drive.google.com/file/d/${fid}/preview` } : null;
  }
  if (host === "loom.com") {
    const m = u.pathname.match(/\/(?:share|embed)\/([a-f0-9]{16,})/i);
    return m ? { kind: "loom", src: `https://www.loom.com/embed/${m[1]}` } : null;
  }
  return null;
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/judging/embed.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 6: Commit**

```bash
git add src/judging/types.ts src/judging/embed.ts src/judging/embed.test.ts
git commit -F - <<'EOF'
Judging: shared types and the video embed parser

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 3: The dealer (assignment)

**Files:**
- Create: `src/judging/dealer.ts`
- Test: `src/judging/dealer.test.ts`

**Interfaces:**
- Consumes: `Judge`, `Track`, `JudgingConfig["assignments"]` from `src/judging/types.ts`; `Submission` from `src/judge/mapRows.ts` (only `teamKey`, `track`, `n`, `duplicateOf`).
- Produces:
```ts
export type DealInput = { submissions: Pick<Submission, "teamKey" | "track" | "n" | "duplicateOf">[]; judges: Judge[]; minPerTeam: number; excluded: string[] };
export type Deal = { assignments: Record<string, string[]>; load: Record<string, number>; warnings: string[] };
export function deal(input: DealInput): Deal;
export function judgesForTrack(judges: Judge[], track: Track): Judge[];
```

- [ ] **Step 1: Write the failing tests** `src/judging/dealer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { deal, judgesForTrack } from "./dealer";
import type { Judge } from "./types";

const J = (id: string, tracks: Judge["tracks"]): Judge => ({ id, name: id, tracks });
const teams = (track: "build" | "pitch", n: number, offset = 0) =>
  Array.from({ length: n }, (_, i) => ({ teamKey: `${track}/t${i + 1}`, track, n: offset + i + 1 }));

describe("judgesForTrack", () => {
  it("includes the track and both, excludes the other and off", () => {
    const js = [J("a", "build"), J("b", "pitch"), J("c", "both"), J("d", "off")];
    expect(judgesForTrack(js, "build").map((j) => j.id)).toEqual(["a", "c"]);
    expect(judgesForTrack(js, "pitch").map((j) => j.id)).toEqual(["b", "c"]);
  });
});

describe("deal", () => {
  it("gives every team k distinct judges and keeps loads within one", () => {
    const judges = [J("a", "build"), J("b", "build"), J("c", "build"), J("d", "both"), J("e", "pitch"), J("f", "pitch")];
    const subs = [...teams("build", 20), ...teams("pitch", 10, 20)];
    const d = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [] });
    for (const s of subs) {
      const js = d.assignments[s.teamKey];
      expect(js).toHaveLength(2);
      expect(new Set(js).size).toBe(2);
      for (const id of js) expect(judgesForTrack(judges, s.track).map((j) => j.id)).toContain(id);
    }
    const buildLoads = ["a", "b", "c", "d"].map((id) => d.load[id]);
    expect(Math.max(...buildLoads) - Math.min(...buildLoads)).toBeLessThanOrEqual(1);
    expect(buildLoads.reduce((x, y) => x + y, 0)).toBe(40);
    expect(d.warnings).toEqual([]);
  });

  it("is deterministic", () => {
    const judges = [J("a", "both"), J("b", "both"), J("c", "both")];
    const subs = teams("build", 7);
    const first = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [] });
    const second = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [] });
    expect(second).toEqual(first);
  });

  it("warns and gives everyone when a track has fewer judges than the minimum", () => {
    const judges = [J("a", "build"), J("b", "pitch")];
    const d = deal({ submissions: teams("pitch", 3), judges, minPerTeam: 2, excluded: [] });
    expect(d.assignments["pitch/t1"]).toEqual(["b"]);
    expect(d.warnings[0]).toMatch(/pitch/i);
  });

  it("warns when a track has no judges at all", () => {
    const d = deal({ submissions: teams("build", 2), judges: [J("a", "pitch")], minPerTeam: 2, excluded: [] });
    expect(d.assignments["build/t1"]).toEqual([]);
    expect(d.warnings.some((w) => /no judge/i.test(w))).toBe(true);
  });

  it("skips duplicates and excluded teams", () => {
    const subs = [...teams("build", 3), { teamKey: "build/t1", track: "build" as const, n: 9, duplicateOf: 1 }];
    const d = deal({ submissions: subs, judges: [J("a", "build"), J("b", "build")], minPerTeam: 2, excluded: ["build/t3"] });
    expect(Object.keys(d.assignments).sort()).toEqual(["build/t1", "build/t2"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/judging/dealer.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/judging/dealer.ts`**

```ts
/* Deal teams to judges. Per track, teams in export order are handed to
   the track's judges round-robin, k at a time, so every team gets k
   distinct judges and no judge carries more than one team over another.
   Deterministic: same inputs, same hands. Michael edits by hand after. */
import type { Submission } from "../judge/mapRows";
import type { Judge, Track } from "./types";

export type DealInput = {
  submissions: Pick<Submission, "teamKey" | "track" | "n" | "duplicateOf">[];
  judges: Judge[];
  minPerTeam: number;
  excluded: string[];
};
export type Deal = { assignments: Record<string, string[]>; load: Record<string, number>; warnings: string[] };

export function judgesForTrack(judges: Judge[], track: Track): Judge[] {
  return judges.filter((j) => j.tracks === track || j.tracks === "both");
}

export function deal({ submissions, judges, minPerTeam, excluded }: DealInput): Deal {
  const assignments: Record<string, string[]> = {};
  const load: Record<string, number> = {};
  const warnings: string[] = [];
  for (const j of judges) load[j.id] = 0;
  const k = Math.max(1, Math.floor(minPerTeam));

  for (const track of ["build", "pitch"] as Track[]) {
    const pool = judgesForTrack(judges, track).map((j) => j.id);
    const teams = submissions
      .filter((s) => s.track === track && !s.duplicateOf && !excluded.includes(s.teamKey))
      .sort((a, b) => a.n - b.n);
    if (teams.length === 0) continue;
    if (pool.length === 0) {
      warnings.push(`No judge is set to the ${track} track. ${teams.length} teams have nobody.`);
      for (const t of teams) assignments[t.teamKey] = [];
      continue;
    }
    if (pool.length < k) {
      warnings.push(`Only ${pool.length} judge${pool.length === 1 ? "" : "s"} on the ${track} track, fewer than the minimum of ${k}. Every ${track} team goes to all of them.`);
    }
    const per = Math.min(k, pool.length);
    teams.forEach((t, i) => {
      const ids: string[] = [];
      for (let j = 0; j < per; j++) ids.push(pool[(i * per + j) % pool.length]);
      assignments[t.teamKey] = ids;
      for (const id of ids) load[id] = (load[id] ?? 0) + 1;
    });
  }
  return { assignments, load, warnings };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/judging/dealer.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/judging/dealer.ts src/judging/dealer.test.ts
git commit -F - <<'EOF'
Judging: the dealer assigns k distinct judges per team, round-robin per track

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 4: Ranking math

**Files:**
- Create: `src/judging/ranking.ts`
- Test: `src/judging/ranking.test.ts`

**Interfaces:**
- Consumes: `Score`, `JudgingConfig`, `Track` from types; `Submission` from mapRows.
- Produces:
```ts
export type TeamRow = {
  teamKey: string; team: string; track: Track; prompt: string;
  scores: Score[];             // every saved score for the team, recusals included
  counted: Score[];            // not recused, lines present
  judgeCount: number;
  mean: number | null;         // mean of counted totals
  meanLine1: number | null; meanLine2: number | null; medianTotal: number | null;
  rank: number | null;         // 1-based within track, null when excluded or unscored
  finalist: boolean;
  flags: string[];             // "Under two judges", "Gate failed: ... (Grant Johnson)", "Recused: Dane Laughlin", "Tie at the cut: leadership decides", "Excluded"
  excluded: boolean;
};
export function rankTrack(track: Track, submissions: Submission[], scores: Score[], config: JudgingConfig, judgeName: (id: string) => string): TeamRow[];
export function compareRows(a: TeamRow, b: TeamRow): number;   // the ordering, exported for tests
```
Rules (spec §8): mean of totals over counted scores; order by mean desc, then meanLine1 desc, then meanLine2 desc, then medianTotal desc; rows with no counted score sort last with `rank` null; excluded rows sort after those, `rank` null. Finalist line after third place; if the row at index 3 ties the row at index 2 on all four keys, both are finalists (four); if a fifth also ties, nobody past third is a finalist and the tied rows get the tie flag. Under two counted scores → flag. Any score with a false gate → flag naming gate label and judge. Any recused score → flag naming judge.

- [ ] **Step 1: Write the failing tests** `src/judging/ranking.test.ts`:

```ts
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
    const three = rankTrack("build", subs, [...scores, score("g", "E", [7, 7, 7, 7], {}), score("d", "E", [7, 7, 7, 7], {})].filter((s) => !(s.teamKey === "build/e" && s.total === 20)), config, name);
    expect(three.filter((r) => r.finalist).map((r) => r.team)).toEqual(["A", "B"]);
    expect(three.find((r) => r.team === "C")!.flags).toContain("Tie at the cut: leadership decides");
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
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/judging/ranking.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/judging/ranking.ts`**

```ts
/* Rank one track. Means, not sums, so a team with three judges is not
   favored over one with two. Order: mean total, then the rubric's
   tie-break (line 1, line 2, median judge total). Excluded and unscored
   rows sink with no rank. Finalist line after third; a two-way tie at
   third makes four; a wider tie stops the line at second and flags. */
import type { Submission } from "../judge/mapRows";
import { GATE_LABELS, type JudgingConfig, type Score, type Track } from "./types";

export type TeamRow = {
  teamKey: string; team: string; track: Track; prompt: string;
  scores: Score[]; counted: Score[]; judgeCount: number;
  mean: number | null; meanLine1: number | null; meanLine2: number | null; medianTotal: number | null;
  rank: number | null; finalist: boolean; flags: string[]; excluded: boolean;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const keys = (r: TeamRow) => [r.mean ?? -1, r.meanLine1 ?? -1, r.meanLine2 ?? -1, r.medianTotal ?? -1];

export function compareRows(a: TeamRow, b: TeamRow): number {
  if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
  const ka = keys(a), kb = keys(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
  return a.team.localeCompare(b.team);
}
const sameKeys = (a: TeamRow, b: TeamRow) => keys(a).every((v, i) => v === keys(b)[i]);

export function rankTrack(track: Track, submissions: Submission[], scores: Score[], config: JudgingConfig, judgeName: (id: string) => string): TeamRow[] {
  const rows: TeamRow[] = submissions
    .filter((s) => s.track === track && !s.duplicateOf)
    .map((s) => {
      const mine = scores.filter((x) => x.teamKey === s.teamKey);
      const counted = mine.filter((x) => !x.recused && x.lines && x.total !== null);
      const totals = counted.map((x) => x.total as number);
      const flags: string[] = [];
      const excluded = config.excluded.includes(s.teamKey);
      if (excluded) flags.push("Excluded");
      if (counted.length < 2) flags.push("Under two judges");
      for (const x of mine) {
        if (x.recused) flags.push(`Recused: ${judgeName(x.judgeId)}`);
        for (const [g, passes] of Object.entries(x.gates)) {
          if (!passes) flags.push(`Gate failed: ${GATE_LABELS[g as keyof typeof GATE_LABELS]} (${judgeName(x.judgeId)})`);
        }
      }
      return {
        teamKey: s.teamKey, team: s.team, track, prompt: s.prompt || s.promptRaw,
        scores: mine, counted, judgeCount: counted.length,
        mean: mean(totals), meanLine1: mean(counted.map((x) => x.lines![0])), meanLine2: mean(counted.map((x) => x.lines![1])),
        medianTotal: median(totals), rank: null, finalist: false, flags, excluded,
      };
    })
    .sort(compareRows);

  let rank = 0;
  for (const r of rows) if (!r.excluded && r.mean !== null) r.rank = ++rank;

  const ranked = rows.filter((r) => r.rank !== null);
  let cut = Math.min(3, ranked.length);
  if (ranked.length > 3 && sameKeys(ranked[2], ranked[3])) {
    const tied = ranked.filter((r) => sameKeys(r, ranked[2]));
    if (tied.length === 2) cut = 4;
    else {
      cut = ranked.indexOf(tied[0]);
      for (const r of tied) r.flags.push("Tie at the cut: leadership decides");
    }
  }
  ranked.slice(0, cut).forEach((r) => (r.finalist = true));
  return rows;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/judging/ranking.test.ts`
Expected: PASS, 6 tests. If the three-way tie test is awkward to express, rewrite it plainly: five teams where C, D and E all score 28 → finalists are exactly A and B, and C, D, E carry the tie flag.

- [ ] **Step 5: Commit**

```bash
git add src/judging/ranking.ts src/judging/ranking.test.ts
git commit -F - <<'EOF'
Judging: ranking math with the rubric tie-break and the finalist line

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 5: The Excel export

**Files:**
- Create: `src/judging/exportXlsx.ts`
- Test: `src/judging/exportXlsx.test.ts`

**Interfaces:**
- Consumes: `TeamRow` from ranking, `Score`, `JudgingConfig`.
- Produces:
```ts
export type ExportInput = { rows: TeamRow[]; config: JudgingConfig; exportedAt: Date };
export function buildWorkbook(input: ExportInput): import("xlsx").WorkBook;     // three sheets
export function workbookFileName(exportedAt: Date): string;                       // "chocolathon-judging-2026-09-19-1532.xlsx" in America/Chicago
export function downloadWorkbook(input: ExportInput): void;                       // XLSX.writeFile in the browser
```
Sheets, in order, with exact header rows:
- `Ranking`: `Track | Rank | Team | Prompt | Mean total | Judges | Mean line 1 | Mean line 2 | Median total | Finalist | Flags`
- `All scores`: `Track | Team | Judge | Line 1 | Line 2 | Line 3 | Line 4 | Total | Gates passed | Recused | Comment | Saved at`
- `Feedback for teams`: `Track | Team | Judge | Line 1 | Line 2 | Line 3 | Line 4 | Total | Comment` where Judge is `Judge A`, `Judge B`, … assigned per team in the order the scores were saved. Recused scores are omitted from this sheet. Gate-failed scores appear with empty lines and the comment.
Rounding: means to two decimals. Track as `Build` / `Pitch`. Finalist as `Yes` / empty. Flags joined with `; `.

- [ ] **Step 1: Write the failing tests** `src/judging/exportXlsx.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/judging/exportXlsx.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/judging/exportXlsx.ts`**

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/judging/exportXlsx.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/judging/exportXlsx.ts src/judging/exportXlsx.test.ts
git commit -F - <<'EOF'
Judging: the three-sheet Excel export, judges as letters on the team sheet

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 6: API: config and scores

**Files:**
- Create: `api/_blob.ts`, `api/_auth.ts`, `api/judging-config.ts`, `api/scores.ts`
- Modify: `.env.local` (add `JUDGE_KEY=<random>`; the file is gitignored). Michael or the orchestrator sets `JUDGE_KEY` in Vercel Production and Development (dashboard, or `vercel env add JUDGE_KEY production` after `vercel link`).
- No unit tests for the functions themselves (no runner for `@vercel/node` here); verified by `npm run build` (tsc includes `api/`? check `tsconfig.json`; if not, run `npx tsc --noEmit -p tsconfig.api.json` if one exists, else `npx tsc --noEmit api/*.ts --module nodenext --moduleResolution nodenext --target es2022 --esModuleInterop --skipLibCheck`) and by the production rehearsal in Task 10.

**Interfaces produced:**
- `GET /api/judging-config` → `JudgingConfig` (200) or 404 `{error}` when none.
- `POST /api/judging-config` (header `x-upload-key`) body `JudgingConfig` → `{ok:true}`. Validates: `judges` array of `{id,name,tracks}` with tracks in the four values; `minPerTeam` integer 1..6; `assignments` object of string arrays; `excluded` string array; `closed` boolean.
- `GET /api/scores?judge=<id>` (header `x-judge-key`) → `{ scores: Score[] }` for that judge.
- `GET /api/scores?all=1` (header `x-upload-key`) → `{ scores: Score[] }`.
- `POST /api/scores` (header `x-judge-key`) body `Score` without `savedAt` → `{ok:true, score}`. Validates: judge id exists in config; teamKey exists in published submissions and is not a duplicate; `lines` is null or four integers 1..10; if `recused` then `lines` null; if any gate false then `lines` null; `comment` string, trimmed length ≥ 20 unless recused; `track` matches the submission; refuses 423 with `{error:"Judging is closed."}` when `config.closed`.
- `DELETE /api/scores` (header `x-upload-key`) → `{ok:true, deleted:n}`.

- [ ] **Step 1: Write `api/_blob.ts`**

```ts
/* Private Vercel Blob helpers shared by the judging functions. The store
   is chocolathon-judging; BLOB_READ_WRITE_TOKEN is injected by Vercel.
   The .js extensions on imports of this file are REQUIRED (ESM loader). */
import { del, get, list, put } from "@vercel/blob";

export async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const found = await get(pathname, { access: "private", useCache: false });
    if (!found || !found.stream) return null;
    return JSON.parse(await new Response(found.stream).text()) as T;
  } catch (err) {
    if (/not.?found/i.test(err instanceof Error ? err.message : "")) return null;
    throw err;
  }
}

export async function writeJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
}

export async function listPaths(prefix: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: 1000, cursor });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export async function readAll<T>(prefix: string): Promise<T[]> {
  const paths = await listPaths(prefix);
  const results = await Promise.all(paths.map((p) => readJson<T>(p)));
  return results.filter((x): x is T => x !== null);
}

export async function deleteAll(prefix: string): Promise<number> {
  const paths = await listPaths(prefix);
  if (paths.length) await del(paths);
  return paths.length;
}

export const PATHS = {
  submissions: "judging/submissions.json",
  config: "judging/config.json",
  scores: "judging/scores/",
  score: (judgeId: string, teamKey: string) => `judging/scores/${judgeId}/${teamKey.replace("/", "__")}.json`,
};
```
Note: `list()` on a private store returns pathnames; `get()` by pathname works with `access: "private"` (same call `api/judging.ts` uses). If `del` with an array is refused for private stores in this SDK version, delete one at a time.

- [ ] **Step 2: Write `api/_auth.ts`**

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

function header(req: VercelRequest, name: string): string {
  return String(req.headers[name] ?? "").trim();
}
/* Returns true when allowed; otherwise writes the refusal and returns false. */
export function requireUploadKey(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.UPLOAD_KEY?.trim();
  if (!expected) { res.status(503).json({ error: "UPLOAD_KEY is not configured." }); return false; }
  if (header(req, "x-upload-key") !== expected) { res.status(401).json({ error: "Wrong upload key." }); return false; }
  return true;
}
export function requireJudgeKey(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.JUDGE_KEY?.trim();
  if (!expected) { res.status(503).json({ error: "JUDGE_KEY is not configured." }); return false; }
  if (header(req, "x-judge-key") !== expected) { res.status(401).json({ error: "This link is not valid. Ask Michael for the judge link." }); return false; }
  return true;
}
export function noStore(res: VercelResponse): void {
  res.setHeader("Cache-Control", "no-store, private");
}
```

- [ ] **Step 3: Write `api/judging-config.ts`**

```ts
/* /api/judging-config: judges, assignments, the closed switch.
   GET is open (the judge page needs names and assignments; nothing
   secret is in it). POST needs the upload key. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PATHS, readJson, writeJson } from "./_blob.js";
import { noStore, requireUploadKey } from "./_auth.js";

type Judge = { id: string; name: string; tracks: "build" | "pitch" | "both" | "off" };
export type JudgingConfig = { judges: Judge[]; minPerTeam: number; assignments: Record<string, string[]>; excluded: string[]; closed: boolean; publishedAt?: string };

const TRACKS = new Set(["build", "pitch", "both", "off"]);
function validate(x: unknown): JudgingConfig | string {
  if (!x || typeof x !== "object") return "Body is not an object.";
  const c = x as Partial<JudgingConfig>;
  if (!Array.isArray(c.judges) || c.judges.some((j) => !j || typeof j.id !== "string" || !/^[a-z0-9-]{1,60}$/.test(j.id) || typeof j.name !== "string" || !j.name.trim() || !TRACKS.has(j.tracks))) return "judges is malformed.";
  if (new Set(c.judges.map((j) => j.id)).size !== c.judges.length) return "Two judges share an id.";
  if (!Number.isInteger(c.minPerTeam) || (c.minPerTeam as number) < 1 || (c.minPerTeam as number) > 6) return "minPerTeam must be 1 to 6.";
  if (!c.assignments || typeof c.assignments !== "object" || Object.values(c.assignments).some((v) => !Array.isArray(v) || v.some((id) => typeof id !== "string"))) return "assignments is malformed.";
  if (!Array.isArray(c.excluded) || c.excluded.some((k) => typeof k !== "string")) return "excluded is malformed.";
  if (typeof c.closed !== "boolean") return "closed must be true or false.";
  return { judges: c.judges, minPerTeam: c.minPerTeam as number, assignments: c.assignments, excluded: c.excluded, closed: c.closed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method === "GET") {
    try {
      const config = await readJson<JudgingConfig>(PATHS.config);
      if (!config) return res.status(404).json({ error: "No judging config published yet." });
      return res.status(200).json(config);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "read failed" });
    }
  }
  if (req.method === "POST") {
    if (!requireUploadKey(req, res)) return;
    let body: unknown;
    try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: "Body is not JSON." }); }
    const config = validate(body);
    if (typeof config === "string") return res.status(400).json({ error: config });
    await writeJson(PATHS.config, { ...config, publishedAt: new Date().toISOString() });
    return res.status(200).json({ ok: true });
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
```

- [ ] **Step 4: Write `api/scores.ts`**

```ts
/* /api/scores: one private blob per judge per team.
   GET ?judge=<id>   judge token   that judge's scores
   GET ?all=1        upload key    every score (ranking, export)
   POST              judge token   save one score; refused once judging is closed
   DELETE            upload key    wipe every score (rehearsal reset) */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PATHS, deleteAll, readAll, readJson, writeJson } from "./_blob.js";
import { noStore, requireJudgeKey, requireUploadKey } from "./_auth.js";
import type { JudgingConfig } from "./judging-config.js";

type Gates = { linkOpens: boolean; videoUnderThree: boolean; oneSubmission: boolean; startedAfterUnlock: boolean };
type Score = { judgeId: string; teamKey: string; track: "build" | "pitch"; gates: Gates; recused: boolean; lines: [number, number, number, number] | null; total: number | null; comment: string; savedAt: string };
type Submission = { teamKey: string; track: "build" | "pitch"; duplicateOf?: number };
type Judging = { submissions: Submission[] };

const GATES = ["linkOpens", "videoUnderThree", "oneSubmission", "startedAfterUnlock"] as const;
const MIN_COMMENT = 20;

function validate(x: unknown, config: JudgingConfig, judging: Judging): Score | string {
  if (!x || typeof x !== "object") return "Body is not an object.";
  const s = x as Partial<Score>;
  if (typeof s.judgeId !== "string" || !config.judges.some((j) => j.id === s.judgeId)) return "Unknown judge.";
  if (typeof s.teamKey !== "string") return "Missing teamKey.";
  const sub = judging.submissions.find((t) => t.teamKey === s.teamKey && !t.duplicateOf);
  if (!sub) return "Unknown team.";
  if (s.track !== sub.track) return "Track does not match the submission.";
  if (!s.gates || typeof s.gates !== "object" || GATES.some((g) => typeof (s.gates as Gates)[g] !== "boolean")) return "gates is malformed.";
  if (typeof s.recused !== "boolean") return "recused must be true or false.";
  const gateFailed = GATES.some((g) => !(s.gates as Gates)[g]);
  if (s.recused || gateFailed) {
    if (s.lines !== null && s.lines !== undefined) return s.recused ? "A recusal carries no lines." : "A failed gate carries no lines.";
  } else {
    if (!Array.isArray(s.lines) || s.lines.length !== 4 || s.lines.some((n) => !Number.isInteger(n) || n < 1 || n > 10)) return "lines must be four whole numbers from 1 to 10.";
  }
  const comment = typeof s.comment === "string" ? s.comment.trim() : "";
  if (!s.recused && comment.length < MIN_COMMENT) return `The comment needs at least ${MIN_COMMENT} characters. The team will read it.`;
  const lines = (s.recused || gateFailed ? null : (s.lines as [number, number, number, number]));
  return { judgeId: s.judgeId, teamKey: s.teamKey, track: sub.track, gates: s.gates as Gates, recused: s.recused, lines, total: lines ? lines.reduce((a, b) => a + b, 0) : null, comment, savedAt: new Date().toISOString() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  try {
    if (req.method === "GET") {
      const all = String(req.query.all ?? "") === "1";
      if (all) {
        if (!requireUploadKey(req, res)) return;
        return res.status(200).json({ scores: await readAll<Score>(PATHS.scores) });
      }
      if (!requireJudgeKey(req, res)) return;
      const judge = String(req.query.judge ?? "").trim();
      if (!/^[a-z0-9-]{1,60}$/.test(judge)) return res.status(400).json({ error: "Missing judge." });
      return res.status(200).json({ scores: await readAll<Score>(`${PATHS.scores}${judge}/`) });
    }
    if (req.method === "POST") {
      if (!requireJudgeKey(req, res)) return;
      const [config, judging] = await Promise.all([readJson<JudgingConfig>(PATHS.config), readJson<Judging>(PATHS.submissions)]);
      if (!config || !judging) return res.status(409).json({ error: "Nothing published to score yet." });
      if (config.closed) return res.status(423).json({ error: "Judging is closed." });
      let body: unknown;
      try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: "Body is not JSON." }); }
      const score = validate(body, config, judging);
      if (typeof score === "string") return res.status(400).json({ error: score });
      await writeJson(PATHS.score(score.judgeId, score.teamKey), score);
      return res.status(200).json({ ok: true, score });
    }
    if (req.method === "DELETE") {
      if (!requireUploadKey(req, res)) return;
      const deleted = await deleteAll(PATHS.scores);
      return res.status(200).json({ ok: true, deleted });
    }
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "failed" });
  }
}
```

- [ ] **Step 5: Add `JUDGE_KEY` locally**: append `JUDGE_KEY=<32 random hex chars>` to `.env.local` (generate with `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`). Record in the task report that Vercel Production and Development still need it (Michael or the orchestrator sets it; the value must be the same one that goes into the judge link).

- [ ] **Step 6: Type-check and build**

Run: `npm run build` and, if `tsconfig` does not include `api/`, `npx tsc --noEmit --module nodenext --moduleResolution nodenext --target es2022 --skipLibCheck api/_blob.ts api/_auth.ts api/judging-config.ts api/scores.ts`.
Expected: no errors. Every relative import in the four files ends in `.js`.

- [ ] **Step 7: Commit**

```bash
git add api/_blob.ts api/_auth.ts api/judging-config.ts api/scores.ts
git commit -F - <<'EOF'
Judging API: config and per-judge-per-team scores in the private blob store

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 7: Upload page: assignment panel, close switch, clear scores

**Files:**
- Modify: `src/upload/UploadPage.tsx`
- Create: `src/upload/AssignmentPanel.tsx`

**Interfaces:**
- Consumes: `deal`, `judgesForTrack` (Task 3); `JudgingConfig`, `Judge`, `judgeId` (Task 2); `Judging`, `Submission` (Task 1); `GET/POST /api/judging-config`, `DELETE /api/scores`, `GET /api/scores?all=1` (Task 6); `HubData.people.preliminary[].name` from `GET /api/hub` (existing) for the default judge list.
- Produces: the panel component `AssignmentPanel({ judging, config, onChange, publish, busy })`.

Behavior (spec §1, §7, §11 step 7):
1. On load, alongside the existing `refreshLive`, GET `/api/judging-config` (404 → `null`) and `/api/hub` (for people). Panel state `config: JudgingConfig` starts from the stored config or, when none, `{ judges: preliminary.map(p => ({ id: judgeId(p.name), name: p.name, tracks: "off" })), minPerTeam: 2, assignments: {}, excluded: [], closed: false }`. Names shown as stored; add a text input "Add a judge" that appends `{ id: judgeId(name), name, tracks: "off" }`.
2. The panel sits under the existing publish block and reads from the **live** submissions (`GET /api/judging`), not the parsed file, so assignment runs against what judges see. Title "Assign the judges." Each judge: name, a four-way segmented control Build / Pitch / Both / Off (buttons with `aria-pressed`). A number input "Minimum judges per team" 1..6. Button "Generate" runs `deal()` and shows per judge "Grant Johnson: 10 teams, about 35 minutes of video" (3.5 minutes per team) and every warning in amber. Under that, per team (grouped by track, export order): team name and its judge names as removable chips plus an "Add judge" select of that track's judges. Button "Publish assignments" POSTs the config with `x-upload-key`. If scores exist (GET `/api/scores?all=1` count > 0) Generate shows a one-line note first: "Scores exist. Regenerating changes who sees what, never the scores." and needs a second click.
3. **Close judging** switch at the bottom: a button that toggles `closed` and POSTs immediately; label "Close judging" / "Reopen judging"; a line under it "Closed: judges can read, not save. Export from the ranking page." Show current state from the stored config.
4. **Clear all scores**: a `btn-ghost` "Clear every score" that on first click turns into "Click again to delete N scores" for five seconds, then DELETEs and reports "Deleted N scores." Only for rehearsal; say so in a small line.
5. The existing file preview additionally shows (from Task 1's return): `dropped` rows ("Sugar Is Sweet submitted twice; keeping the 9:09 PM row."), `warnings` in amber, `optionalMissing` as a grey line "Not found in this export: Instructions for the judge, Confirmation." Non-URL warnings never block Publish; missing required columns still do.
6. All copy: sentences, no em dashes.

- [ ] **Step 1: Write `src/upload/AssignmentPanel.tsx`** with the behavior above. Skeleton:

```tsx
import { useMemo, useState } from "react";
import { deal, judgesForTrack } from "../judging/dealer";
import { judgeId, type Judge, type JudgeTracks, type JudgingConfig } from "../judging/types";
import type { Judging } from "../judge/mapRows";

const TRACKS: { value: JudgeTracks; label: string }[] = [{ value: "build", label: "Build" }, { value: "pitch", label: "Pitch" }, { value: "both", label: "Both" }, { value: "off", label: "Off" }];

export default function AssignmentPanel({ judging, config, scoreCount, onChange, publish, busy }: {
  judging: Judging | null; config: JudgingConfig; scoreCount: number;
  onChange: (c: JudgingConfig) => void; publish: (c: JudgingConfig) => Promise<void>; busy: boolean;
}) {
  const [newJudge, setNewJudge] = useState("");
  const [armed, setArmed] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof deal> | null>(null);
  const visible = useMemo(() => (judging?.submissions ?? []).filter((s) => !s.duplicateOf), [judging]);

  function setTracks(id: string, tracks: JudgeTracks) { onChange({ ...config, judges: config.judges.map((j) => (j.id === id ? { ...j, tracks } : j)) }); }
  function addJudge() { const name = newJudge.trim(); if (!name) return; const j: Judge = { id: judgeId(name), name, tracks: "off" }; if (config.judges.some((x) => x.id === j.id)) return; onChange({ ...config, judges: [...config.judges, j] }); setNewJudge(""); }
  function generate() {
    if (scoreCount > 0 && !armed) { setArmed(true); return; }
    const d = deal({ submissions: visible, judges: config.judges, minPerTeam: config.minPerTeam, excluded: config.excluded });
    setResult(d); setArmed(false); onChange({ ...config, assignments: d.assignments });
  }
  function setTeamJudges(teamKey: string, ids: string[]) { onChange({ ...config, assignments: { ...config.assignments, [teamKey]: ids } }); }
  const name = (id: string) => config.judges.find((j) => j.id === id)?.name ?? id;
  const load = (id: string) => Object.values(config.assignments).filter((ids) => ids.includes(id)).length;
  // …render: judges list with segmented controls, minPerTeam input, Generate, loads + warnings,
  // per-track team lists with chips and an add select, Publish assignments button.
}
```
Render details: use `label` for small captions, `btn-cta` for Publish assignments, `btn-ghost` / `btn-ghost-sm` for Generate and chips; the segmented control copies the Build/Pitch tab markup in `JudgePage.tsx` (`role="tablist"`, `bg-ink !text-white` for the active one). Show `about ${Math.round(load*3.5)} minutes of video` per judge.

- [ ] **Step 2: Wire it into `UploadPage.tsx`**: new state `config`, `scoreCount`, `live judging` (already fetched as count; fetch the full `Judging` now), loaders on mount, `publishConfig(c)` POST with the key, the Close switch, the Clear button, and the preview additions (item 5). Keep the existing publish flow untouched. After a successful submissions publish, re-fetch the live judging so the panel sees the new teams.

- [ ] **Step 3: Build and eyeball**

Run: `npm run build`. Then serve `dist/` with a small local server that proxies `/api/*` to production (the orchestrator has one in the scratchpad: `preview-server.mjs`) or run `vercel dev` if linked. Open `/upload-k4n8pq`, confirm: the panel renders with five judges from `/api/hub`, Generate deals against the live two sample rows, warnings show, Close toggles (do not publish anything to production from this task; the rehearsal is Task 10).

- [ ] **Step 4: Commit**

```bash
git add src/upload/UploadPage.tsx src/upload/AssignmentPanel.tsx
git commit -F - <<'EOF'
Upload page: assign the judges, close judging, clear scores, and the preview shows drops and warnings

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 8: The judge page

**Files:**
- Rewrite: `src/judge/JudgePage.tsx`
- Create: `src/judge/ScoreCard.tsx`, `src/judge/useScores.ts`, `src/judge/VideoEmbed.tsx`
- Test: `src/judge/useScores.test.ts` (the pure parts: draft key, merge of server scores and local drafts, retry scheduling)

**Interfaces:**
- Consumes: `videoEmbed` (Task 2), `Score`, `Gates`, `GATE_LABELS`, `JudgingConfig`, `scoreTotal` (Task 2), `Submission`/`Judging` (Task 1), `RubricView`'s `Rubric` type from `src/competitor/types.ts`, `GET /api/judging`, `GET /api/judging-config`, `GET /api/hub`, `GET/POST /api/scores` (Task 6).
- Produces: nothing other tasks consume.

Behavior (spec §6), in order:
1. **Token.** `const token = new URLSearchParams(location.search).get("k") ?? localStorage["choco-judge-key"]`. If present in the URL, store it and strip it from the address bar with `history.replaceState`. If absent, render only: "This link is not valid. Ask Michael for the judge link." Every scores request sends `x-judge-key: token`; a 401 renders the same line.
2. **Who are you?** From config.judges (tracks not `off` first, then the rest). Buttons with the names. Stored in `localStorage["choco-judge-id"]`. Header shows "Not you? Switch" which clears it.
3. **Queue.** Header line: "{Judge first name} · {Build|Pitch} track · {scored} of {assigned} scored". If a judge is `both`, a Build/Pitch toggle appears (reuse the existing tablist). List: assigned teams in export order, each a row with team name, prompt id, and either a check plus total ("✓ 31"), "Recused", "Gate" or an empty circle; the first unscored row is highlighted with `bg-ink/[0.04]`. Clicking a row scrolls to its card (`scroll-mt-24`, ids `s-${teamKey}`). Below the assigned cards: a `<details>` "Also in your track, not assigned to you ({n})" holding the other cards of that track. When `config.closed`: header says "Judging is closed. Thank you." and cards render read-only (inputs `disabled`, Save hidden by `visibility`).
4. **Card** (`ScoreCard`): team name, prompt id and title (from hub prompts), `sentence`. **Video**: `videoEmbed(s.video)` → `<iframe src loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-sm border border-ink/10" title={`${s.team} video`} />`; null → a `btn-cta` "Watch the video" (large). Under the player always a small `btn-ghost-sm` "Open the video in a new tab". Then the buttons "Open the demo" (`btn-cta` when embedded, else `btn-ghost`), "Source". Then `clickFirst` as "What to click first" and `notes` as "From the team" when present. Then the **rubric for the card's track**: four rows, each the criterion name (display face), the three anchors small, and ten `<button type="button" aria-pressed>` numbered 1–10 (min 40px square, `bg-ink !text-white` when pressed). Then the textarea labeled "Feedback for the team. They will read this." with a live counter "{n} of 20 characters minimum" until 20. Then the four gates as checkboxes (labels from `GATE_LABELS`), all pre-checked; unchecking any one disables the ten-button rows (they keep their paint, `disabled`), sets `lines` to null, and changes the textarea label to "Say which gate failed and why. The team is told." Then a `btn-ghost-sm` "I know this team, skip it" that sets `recused: true`, disables everything, and saves at once with `comment: ""`. Then **Save** (`btn-cta`), disabled until the card is valid (four lines chosen or a gate unchecked, comment ≥ 20 chars). A state line beside Save: "Saving…", "Saved 2:41 PM", "Not saved. Kept on this device, retrying…" (amber), "Judging is closed." A saved card stays editable until closed; editing shows "Changed, not saved" until Save.
5. **`useScores(judgeId, token)`**: loads `GET /api/scores?judge=` once; keeps `scores: Record<teamKey, Score>`; `save(score)` writes a draft to `localStorage["choco-draft:" + judgeId + ":" + teamKey]`, POSTs, on 200 stores the returned score and clears the draft, on network failure or 5xx keeps the draft and retries every 10 s (`setInterval`, cleared on success or unmount), on 400/401/423 stops and surfaces the server's `error` text (a 400 is a validation mistake, not a retry case). On load, any drafts in localStorage for this judge are retried first. Pure helpers exported and unit-tested: `draftKey(judgeId, teamKey)`, `mergeScores(server: Score[], drafts: Score[]): Record<string, Score>` (draft wins when its `savedAt` is newer or the server has none), `shouldRetry(status: number | null): boolean` (null, 0, ≥500, 408, 429 → true; else false).
6. Remove `JUDGE_FORM_URL` usage from this page. Leave the constant in `links.ts` but change its comment to say it is retired 2026-09-15 (Task 9 removes it if nothing else imports it).
7. Phone width: ten buttons wrap to two rows of five (`flex flex-wrap gap-1.5`); the iframe is full width; the queue list stacks above the cards.

- [ ] **Step 1: Write the failing hook-helper tests** `src/judge/useScores.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**: `npx vitest run src/judge/useScores.test.ts` → FAIL.

- [ ] **Step 3: Write `src/judge/useScores.ts`** with the three helpers exported and the hook:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { Score } from "../judging/types";

export const draftKey = (judgeId: string, teamKey: string) => `choco-draft:${judgeId}:${teamKey}`;
export function mergeScores(server: Score[], drafts: Score[]): Record<string, Score> {
  const out: Record<string, Score> = {};
  for (const s of server) out[s.teamKey] = s;
  for (const d of drafts) { const cur = out[d.teamKey]; if (!cur || d.savedAt > cur.savedAt) out[d.teamKey] = d; }
  return out;
}
export const shouldRetry = (status: number | null) => status === null || status === 0 || status >= 500 || status === 408 || status === 429;

export type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: string } | { kind: "retrying"; message: string } | { kind: "refused"; message: string };

export function useScores(judgeId: string | null, token: string | null) {
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [states, setStates] = useState<Record<string, SaveState>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const timers = useRef<Record<string, number>>({});
  // load: GET /api/scores?judge=, read drafts from localStorage (keys starting with draftKey(judgeId, "")), merge, then retry each draft via save()
  // save(score): write draft, POST, handle 200 / refused / retry(10s)
  // return { scores, states, loadError, save }
}
```
Fill the hook body per item 5. Timestamps for drafts: `new Date().toISOString()` at the moment of Save.

- [ ] **Step 4: Run the helper tests**: PASS, 4 tests.

- [ ] **Step 5: Write `src/judge/VideoEmbed.tsx`** (iframe or button per item 4) and **`src/judge/ScoreCard.tsx`** (item 4, props: `submission`, `rubric: Rubric | null`, `promptTitle: string`, `score: Score | undefined`, `state: SaveState`, `closed: boolean`, `judgeId`, `onSave(score: Omit<Score, "savedAt">)`). Local card state: `lines: (number|null)[4]`, `comment`, `gates`, initialised from `score` when present. Validity: `recused || (gateFailed && comment.trim().length >= 20) || (lines.every(n => n !== null) && comment.trim().length >= 20)`.

- [ ] **Step 6: Rewrite `src/judge/JudgePage.tsx`** per items 1–3 and 6–7. Data loading: `Promise.all` of `/api/judging` (no static fallback any more: on 404 show "Nothing published yet. Michael publishes at 2:00."), `/api/judging-config` (404 → "The judges are not set up yet."), `/api/hub`. Keep the `noindex` effect and the `document.title`.

- [ ] **Step 7: Build and check in a browser** at 1280 and 390 wide against the local preview server with the two sample rows: token missing → the one line; with `?k=<JUDGE_KEY from .env.local>` → picker → queue → a card with the YouTube sample embedded (the sample rows' video links must be real YouTube URLs; if they are not, use `https://youtu.be/JWhICz1QR8M` in the local preview only). Saving will fail locally without the API; confirm the amber retry state and the draft in localStorage. No console errors, no sideways scroll at 390.

- [ ] **Step 8: Commit**

```bash
git add src/judge
git commit -F - <<'EOF'
Judge page: pick your name, work your queue, watch in the card, score and write feedback, saves that never get lost

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 9: The ranking page

**Files:**
- Create: `src/results/ResultsPage.tsx`
- Modify: `src/content/links.ts` (add `RESULTS_PATH = "/results-m3v8tq"`, retire `JUDGE_FORM_URL` if no longer imported), `src/App.tsx` (route), `vercel.json` (add the new path to the same `noindex` / `no-store` header rule the judge and upload paths use; read the file first)

**Interfaces:**
- Consumes: `rankTrack`, `TeamRow` (Task 4), `downloadWorkbook` (Task 5), `JudgingConfig` (Task 2), `GET /api/judging`, `GET /api/judging-config`, `POST /api/judging-config`, `GET /api/scores?all=1` (Task 6).

Behavior (spec §8, §9):
1. Key gate like the upload page: password input stored in `localStorage["choco-upload-key"]` (same key, same storage name so Michael types it once). Until a GET with the key returns 200, only the input shows.
2. Loads submissions, config, all scores; re-fetches all three every 30 s (`setInterval`), with a "Updated 2:41:07 PM" line and a "Refresh now" `btn-ghost-sm`.
3. Two columns at ≥1024px (`grid lg:grid-cols-2 gap-10`), stacked below. Each column: heading "Build Track." / "Pitch Track.", then a table: `#`, Team, Prompt, Mean, Judges (red `label-alert` when < 2), L1, L2, Median, and a flags cell. Finalist rows carry a gold left border (`border-l-2 border-gold`); a rule with the label "Finalists above this line" sits after the last finalist. Excluded rows sit under a "Excluded" caption at the bottom in `text-ink/50`. Each row expands (a `<details>` in the team cell) to show every judge: name, four lines, total, gates, recused, comment.
4. Controls at the top right: **Export Excel** (`btn-cta`, calls `downloadWorkbook({ rows: [...build, ...pitch], config, exportedAt: new Date() })`), **Close judging / Reopen judging** (POSTs config with `closed` toggled), and per row an **Exclude / Include** `btn-ghost-sm` that toggles the teamKey in `config.excluded` and POSTs. A one-line note under Export: "Close judging first, then export, so the file matches what picked the finalists."
5. Summary line under the title: "{scored} of {teams} teams have two or more judges · {n} flags". Red when any team is under two.
6. `noindex` meta effect, `document.title = "Chocolathon — Ranking"`.

- [ ] **Step 1: Add the path and route.** In `links.ts`:

```ts
/* The ranking page (2026-09-15): Michael's only, behind the upload key.
   Unlisted like the judge and upload pages. */
export const RESULTS_PATH = "/results-m3v8tq";
```
In `App.tsx`, add `isResultsRoute` mirroring `isUploadRoute` and a lazy `ResultsPage` branch before the judge branch. In `vercel.json`, add the path to the headers rule that covers `/judge-c7m2x9` and `/upload-k4n8pq`.

- [ ] **Step 2: Write `src/results/ResultsPage.tsx`** per the behavior above. Reuse the `useEffect` patterns from `UploadPage.tsx` for the key and the meta tag.

- [ ] **Step 3: Build and check** against the local preview (the `?all=1` call needs the key; the proxy passes headers through to production, which currently holds no scores, so expect an empty ranking with "0 of 2 teams have two or more judges"). Check 1280 and 390 widths, no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/results src/App.tsx src/content/links.ts vercel.json
git commit -F - <<'EOF'
Ranking page: two tracks, flags, the finalist line, exclude, close judging, Excel export

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 10: Rehearsal fixture and the production dress rehearsal

**Files:**
- Create: `pipeline/make-rehearsal.mjs`
- Output (not committed): `<scratchpad>/rehearsal-30.xlsx`

- [ ] **Step 1: Write `pipeline/make-rehearsal.mjs`**: uses `xlsx` to write a workbook whose header row is exactly the fixture `HEADER` from Task 1 and whose 30 rows are fictional teams (names like "Cocoa Compilers", "Ganache Gang", "Tempered Logic", …, no real team names), 18 Build and 12 Pitch, prompts `B-0: Rehearsal prompt` / `P-0: Rehearsal prompt`, real embeddable video links rotating through `https://youtu.be/JWhICz1QR8M`, `https://vimeo.com/76979871`, `https://www.youtube.com/watch?v=aqz-KE-bpKQ`, one deliberately bad video link (`Trat`), one SharePoint product link, one duplicate team (two rows, later completion time wins), completion times spread 9:12 to 13:58. Usage: `node pipeline/make-rehearsal.mjs <out.xlsx>`.

- [ ] **Step 2: Set `JUDGE_KEY` in Vercel** (Production and Development), same value as `.env.local`. If `vercel link` is broken, do it in the dashboard: Project → Settings → Environment Variables. Redeploy is not needed for env on the next deploy; this task's push triggers one.

- [ ] **Step 3: Push and deploy** (only on Michael's yes; the orchestrator asks). Confirm the bundle name on production matches `dist/`, `/api/judging-config` returns 404 JSON (not HTML), `/api/scores` returns 401 JSON without a key.

- [ ] **Step 4: Dress rehearsal on production**, in a browser, recorded step by step in the report:
  1. Upload page: drop `rehearsal-30.xlsx`. Preview shows 30 rows, 1 dropped duplicate, the two link warnings, no optional columns missing. Publish.
  2. Assign: four judges Build, one Pitch, one Both, minimum 2. Generate: every team has two, loads within one, Pitch warns nothing (two judges). Publish assignments.
  3. Judge page with `?k=`: three browser contexts as three judges. Score two teams each with real comments, one recusal, one gate failure with the comment, one save with the network offline (DevTools) that recovers when online.
  4. Ranking: order, flags (under two judges everywhere except the scored teams), the finalist line, expand a row, Exclude one team and Include it again. Export: the .xlsx opens, three sheets, letters not names on the third.
  5. Close judging: a save from a judge context returns "Judging is closed." Reopen.
  6. Clear every score (two clicks). Ranking shows zero scores. Publish the two-row sample again (`pipeline/sample-responses.xlsx`) so production is quiet.
  7. Phone width pass on the judge page and the ranking.

- [ ] **Step 5: Commit the generator** and report: what passed, what did not, console errors, and the exact steps Michael repeats on his laptop.

```bash
git add pipeline/make-rehearsal.mjs
git commit -F - <<'EOF'
Judging: a 30-team rehearsal export generator with the real form headers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

## Self-review notes

- Spec §1–§12 map to Tasks 1–10; §13 (people, gate wording) shipped separately as commit `201996f`.
- `teamKey` slashes: blob pathnames replace `/` with `__` inside the score filename (`PATHS.score`) so `judging/scores/<judge>/<track>__<slug>.json` stays one level deep; `listPaths(prefix)` per judge relies on that.
- `duplicateOf` is optional on `Submission`; the ranking and dealer both filter it out.
- The judge page drops the static-JSON fallback on purpose: silently showing rehearsal rows to a judge at 2:10 is worse than a clear "nothing published".
- The default judge list comes from `/api/hub` people, so adding Nic Wentling later is a content edit plus "Add a judge" on the panel.
