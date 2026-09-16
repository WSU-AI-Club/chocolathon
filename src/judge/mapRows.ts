/* Turn the submission form's export (a header row plus data rows, from
   Excel or CSV) into the submissions the judge page shows.

   Columns are matched by keyword, not position, so reordering or lightly
   renaming a question does not break it. Missing required columns are
   reported by name. The same logic lives in pipeline/make-judging.mjs
   for the command-line fallback; keep the keyword lists in step. */

export type Submission = {
  n: number;
  team: string;
  teamKey: string;
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
  /* Set only on entries returned in `dropped`: the `n` of the visible
     submission (in `judging.submissions`) that was kept instead. */
  duplicateOf?: number;
};

export type Judging = {
  generatedAt: string;
  publishedAt?: string;
  source: string;
  sample: boolean;
  count: number;
  submissions: Submission[];
};

export type MapRowsResult = {
  judging: Judging;
  missing: string[];
  /* Losing rows of a same-team duplicate pair (see teamKey below). Never
     part of the published `judging` object. */
  dropped: Submission[];
  /* Non-blocking link/format problems on the visible submissions, for
     the upload preview. Publishing is not blocked by these. */
  warnings: string[];
  /* Keys (from KEYWORDS, plus "teamFallback") whose column was not
     found in this export, so a renamed question is visible before
     publish. */
  optionalMissing: string[];
};

/* Keyword lists for columns matched by substring (case-insensitive,
   first match wins). "team" is deliberately not here: it is matched by
   exact title below, because "Team name, if not listed." also contains
   the substring "team name". */
const KEYWORDS: Record<string, string[]> = {
  submitter: ["submitter name"],
  email: ["wsu email", "email"],
  track: ["track"],
  buildPrompt: ["build track prompt", "build prompt"],
  pitchPrompt: ["pitch track prompt", "pitch prompt"],
  sentence: ["one sentence", "describe what you built", "describe", "recommending"],
  product: ["link to your product", "product", "demo, or presentation"],
  video: ["link to your video", "video"],
  clickFirst: ["click first", "instructions for the judge", "instructions"],
  repo: ["repositor", "source link"],
  tested: ["tested", "confirmation"],
  notes: ["anything the judges", "need to run", "additional comments", "comments for the judges"],
  time: ["completion time", "start time"],
};
const REQUIRED = ["team", "track", "product", "video"];
/* Optional columns worth calling out by name when a renamed question
   makes them disappear. */
const OPTIONAL_TRACKED = ["clickFirst", "repo", "tested", "notes", "email", "submitter", "teamFallback"];

const NOT_LISTED_TEXT = "my team is not listed";

/* "Team Name", "Team Name1" (Forms de-dupes a repeated question title
   with a trailing digit) and "Team Name." all mean the same column;
   never match "team name" as a substring, since the fallback question
   ("Team name, if not listed.") contains it too. */
function normalizeExactHeader(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.\d]+$/, "")
    .trim();
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Forms writes completion/start time as "M/D/YY H:mm" or "M/D/YY
   H:mm:ss", 24-hour, no timezone (it's whatever the responder's clock
   said). Returns epoch ms in local time, or null if it doesn't parse. */
function parseFormsDate(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, mo, d, y, h, mi, sec] = m;
  let year = parseInt(y, 10);
  if (year < 100) year += 2000;
  const dt = new Date(year, parseInt(mo, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(mi, 10), sec ? parseInt(sec, 10) : 0);
  return Number.isNaN(dt.getTime()) ? null : dt.getTime();
}

const URL_RE = /^https?:\/\/\S+$/i;

function linkWarning(label: string, teamName: string, raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null; // an empty link is flagged elsewhere as "missing a link"
  if (!URL_RE.test(trimmed)) {
    return `${teamName}: ${label} is not a web address ("${trimmed}").`;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) {
    return `${teamName}: ${label} points at localhost, which judges cannot open.`;
  }
  if (lower.includes("sharepoint.com") || lower.includes("onedrive.live.com") || lower.includes("1drv.ms")) {
    return `${teamName}: ${label} points at SharePoint/OneDrive, which external judges may not be able to open.`;
  }
  return null;
}

export function mapRows(header: string[], rows: string[][], source: string): MapRowsResult {
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
  /* Email: Forms' own sign-in "Email" column wins over a typed "WSU
     email" question, even though the substring match above prefers
     "wsu email" first. Fall back to the substring match when there is
     no column titled exactly "email". */
  const exactEmail = h.findIndex((c) => c === "email");
  if (exactEmail !== -1) idx.email = exactEmail;
  /* Team: exact title only, never substring (see KEYWORDS comment). */
  idx.team = h.findIndex((c) => normalizeExactHeader(c) === "team name");
  idx.team = idx.team === -1 ? null : idx.team;
  idx.teamFallback = h.findIndex((c) => c.includes("not listed"));
  idx.teamFallback = idx.teamFallback === -1 ? null : idx.teamFallback;
  /* Submitter: fall back to Forms' own sign-in "Name" column when there
     is no dedicated "Submitter Name" question. */
  if (idx.submitter === null) {
    const exactName = h.findIndex((c) => c === "name");
    if (exactName !== -1) idx.submitter = exactName;
  }

  const missing = REQUIRED.filter((k) => idx[k] === null);
  const optionalMissing = OPTIONAL_TRACKED.filter((k) => idx[k] === null);
  const get = (r: string[], k: string) => (idx[k] === null ? "" : String(r[idx[k] as number] ?? "").trim());
  const resolveTeam = (r: string[]) => {
    const teamCell = get(r, "team");
    if (!teamCell || teamCell.toLowerCase() === NOT_LISTED_TEXT) {
      return get(r, "teamFallback");
    }
    return teamCell;
  };
  const promptId = (s: string) => {
    const m = s.match(/\b([BP])[\s-]?(\d)\b/i);
    return m ? `${m[1].toUpperCase()}-${m[2]}` : "";
  };

  type RawSub = Submission & { _rawIndex: number; _completionMs: number | null };

  const allRaw: RawSub[] = rows
    .filter((r) => r.some((c) => String(c ?? "").trim() !== ""))
    .map((r, i) => {
      const track: "build" | "pitch" = get(r, "track").toLowerCase().startsWith("pitch") ? "pitch" : "build";
      const promptRaw =
        track === "build"
          ? get(r, "buildPrompt") || get(r, "pitchPrompt")
          : get(r, "pitchPrompt") || get(r, "buildPrompt");
      const team = resolveTeam(r);
      const completionRaw = get(r, "time");
      return {
        n: i + 1,
        team,
        teamKey: `${track}/${slugify(team)}`,
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
        /* Confirmation/tested column: empty = not confirmed; any other
           text (a legacy "Yes", "I have tested…", or a checkbox label)
           counts as confirmed. */
        tested: get(r, "tested").length > 0,
        notes: get(r, "notes"),
        submittedAt: completionRaw,
        _rawIndex: i,
        _completionMs: parseFormsDate(completionRaw),
      };
    });

  /* Duplicates: two rows for the same team (and track) keep the one
     with the later completion time; if either time doesn't parse, the
     row that appears later in the export wins. */
  const groups = new Map<string, RawSub[]>();
  for (const s of allRaw) {
    const arr = groups.get(s.teamKey);
    if (arr) arr.push(s);
    else groups.set(s.teamKey, [s]);
  }
  const droppedRaw = new Set<number>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    let winner = group[0];
    for (const cur of group.slice(1)) {
      const bothParse = winner._completionMs !== null && cur._completionMs !== null;
      const curWins = bothParse
        ? (cur._completionMs as number) > (winner._completionMs as number)
        : cur._rawIndex > winner._rawIndex;
      if (curWins) winner = cur;
    }
    for (const s of group) {
      if (s !== winner) droppedRaw.add(s._rawIndex);
    }
  }

  const strip = ({ _rawIndex: _a, _completionMs: _b, ...rest }: RawSub): Submission => rest;

  const submissions: Submission[] = allRaw
    .filter((s) => !droppedRaw.has(s._rawIndex))
    .map((s, i) => ({ ...strip(s), n: i + 1 }));

  const finalNByTeamKey = new Map<string, number>();
  for (const s of submissions) finalNByTeamKey.set(s.teamKey, s.n);

  const dropped: Submission[] = allRaw
    .filter((s) => droppedRaw.has(s._rawIndex))
    .map((s, i) => ({ ...strip(s), n: i + 1, duplicateOf: finalNByTeamKey.get(s.teamKey) }));

  const warnings: string[] = [];
  for (const s of submissions) {
    const pw = linkWarning("product link", s.team, s.product);
    if (pw) warnings.push(pw);
    const vw = linkWarning("video link", s.team, s.video);
    if (vw) warnings.push(vw);
  }

  return {
    judging: {
      generatedAt: new Date().toISOString(),
      source,
      sample: /sample/i.test(source),
      count: submissions.length,
      submissions,
    },
    missing,
    dropped,
    warnings,
    optionalMissing,
  };
}
