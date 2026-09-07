/* Turn the submission form's export (a header row plus data rows, from
   Excel or CSV) into the submissions the judge page shows.

   Columns are matched by keyword, not position, so reordering or lightly
   renaming a question does not break it. Missing required columns are
   reported by name. The same logic lives in pipeline/make-judging.mjs
   for the command-line fallback; keep the keyword lists in step. */

export type Submission = {
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

export type Judging = {
  generatedAt: string;
  publishedAt?: string;
  source: string;
  sample: boolean;
  count: number;
  submissions: Submission[];
};

const KEYWORDS: Record<string, string[]> = {
  team: ["team name"],
  submitter: ["submitter name"],
  email: ["wsu email", "email"],
  track: ["track"],
  buildPrompt: ["build track prompt", "build prompt"],
  pitchPrompt: ["pitch track prompt", "pitch prompt"],
  sentence: ["one sentence", "describe what you built", "describe", "recommending"],
  product: ["link to your product", "product", "demo, or presentation"],
  video: ["link to your video", "video"],
  clickFirst: ["click first"],
  repo: ["repositor", "source link"],
  tested: ["tested"],
  notes: ["anything the judges", "need to run"],
  time: ["completion time", "start time"],
};
const REQUIRED = ["team", "track", "product", "video"];

export function mapRows(
  header: string[],
  rows: string[][],
  source: string,
): { judging: Judging; missing: string[] } {
  const h = header.map((x) => String(x ?? "").trim().toLowerCase());
  const idx: Record<string, number | null> = {};
  for (const [key, words] of Object.entries(KEYWORDS)) {
    idx[key] = null;
    for (const w of words) {
      const i = h.findIndex((c) => c.includes(w));
      if (i !== -1) {
        idx[key] = i;
        break;
      }
    }
  }
  /* "track" must not land on "build track prompt": prefer an exact match. */
  const exactTrack = h.findIndex((c) => c === "track");
  if (exactTrack !== -1) idx.track = exactTrack;
  /* "video" must not land on the product column and vice versa. */
  if (idx.product !== null && idx.product === idx.video) {
    const alt = h.findIndex((c, i) => i !== idx.product && c.includes("video"));
    idx.video = alt === -1 ? null : alt;
  }

  const missing = REQUIRED.filter((k) => idx[k] === null);
  const get = (r: string[], k: string) => (idx[k] === null ? "" : String(r[idx[k] as number] ?? "").trim());
  const promptId = (s: string) => {
    const m = s.match(/\b([BP])[\s-]?(\d)\b/i);
    return m ? `${m[1].toUpperCase()}-${m[2]}` : "";
  };

  const submissions: Submission[] = rows
    .filter((r) => r.some((c) => String(c ?? "").trim() !== ""))
    .map((r, i) => {
      const track: "build" | "pitch" = get(r, "track").toLowerCase().startsWith("pitch") ? "pitch" : "build";
      const promptRaw =
        track === "build"
          ? get(r, "buildPrompt") || get(r, "pitchPrompt")
          : get(r, "pitchPrompt") || get(r, "buildPrompt");
      return {
        n: i + 1,
        team: get(r, "team"),
        submitter: get(r, "submitter"),
        email: get(r, "email"),
        track,
        prompt: promptId(promptRaw),
        promptRaw,
        sentence: get(r, "sentence"),
        product: get(r, "product"),
        video: get(r, "video"),
        clickFirst: get(r, "clickFirst"),
        repo: get(r, "repo"),
        tested: /yes|true|1|✓|checked/i.test(get(r, "tested")),
        notes: get(r, "notes"),
        submittedAt: get(r, "time"),
      };
    });

  return {
    judging: {
      generatedAt: new Date().toISOString(),
      source,
      sample: /sample/i.test(source),
      count: submissions.length,
      submissions,
    },
    missing,
  };
}
