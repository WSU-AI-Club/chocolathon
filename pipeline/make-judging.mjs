#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   make-judging — turn the submission form's export into the judge page.

   ON THE DAY (2:00 PM, the moment the form closes):

     1. In Microsoft Forms, open the submission form → Responses →
        "Open in Excel". Save that workbook as CSV (File → Save As →
        CSV UTF-8). Call it responses.csv.
     2. From the repo root:
           node pipeline/make-judging.mjs responses.csv
        It writes public/judging/submissions.json.
     3. git add public/judging && git commit -m "Judging: 2:00 export"
        && git push
        The deploy takes about fifteen seconds. The judge page reads the
        JSON on load, so judges refresh once.

   Columns are matched by keyword, not position, so reordering the form
   does not break this. If a column is missing the script says which.
   Same keyword lists as src/judge/mapRows.ts (the browser upload path);
   keep the two in step.

   Rehearsal: node pipeline/make-judging.mjs pipeline/sample-responses.csv
   writes the same file with `"sample": true`, and the judge page shows a
   "rehearsal data" banner. Replace it with the real export on the day.
   ═══════════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("usage: node pipeline/make-judging.mjs responses.csv");
  process.exit(1);
}

/* A small RFC-4180 parser: quoted fields, doubled quotes, newlines
   inside quotes, CRLF or LF. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

/* "Team Name", "Team Name1" (Forms de-dupes a repeated question title
   with a trailing digit) and "Team Name." all mean the same column;
   never match "team name" as a substring — "Team name, if not listed."
   contains it too. */
function normalizeExactHeader(s) {
  return s.trim().toLowerCase().replace(/[.\d]+$/, "").trim();
}

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Forms writes completion/start time as "M/D/YY H:mm" or "M/D/YY
   H:mm:ss", 24-hour, no timezone. Returns epoch ms in local time, or
   null if it doesn't parse. */
function parseFormsDate(s) {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, mo, d, y, h, mi, sec] = m;
  let year = parseInt(y, 10);
  if (year < 100) year += 2000;
  const dt = new Date(year, parseInt(mo, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(mi, 10), sec ? parseInt(sec, 10) : 0);
  return Number.isNaN(dt.getTime()) ? null : dt.getTime();
}

const URL_RE = /^https?:\/\/\S+$/i;
function linkWarning(label, teamName, raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!URL_RE.test(trimmed)) return `${teamName}: ${label} is not a web address ("${trimmed}").`;
  const lower = trimmed.toLowerCase();
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) {
    return `${teamName}: ${label} points at localhost, which judges cannot open.`;
  }
  if (lower.includes("sharepoint.com") || lower.includes("onedrive.live.com") || lower.includes("1drv.ms")) {
    return `${teamName}: ${label} points at SharePoint/OneDrive, which external judges may not be able to open.`;
  }
  return null;
}

const raw = readFileSync(resolve(input), "utf8").replace(/^﻿/, "");
const rows = parseCsv(raw);
if (rows.length < 2) {
  console.error("no data rows in", input);
  process.exit(1);
}
const header = rows[0].map((h) => h.trim().toLowerCase());

/* Find a column by the first keyword that matches; report the miss. */
function col(...keywords) {
  for (const k of keywords) {
    const i = header.findIndex((h) => h.includes(k));
    if (i !== -1) return i;
  }
  return null;
}
const C = {
  submitter: col("submitter name"),
  email: col("wsu email", "email"),
  track: col("track"),
  buildPrompt: col("build track prompt", "build prompt"),
  pitchPrompt: col("pitch track prompt", "pitch prompt"),
  sentence: col("one sentence", "describe what you built", "describe", "recommending"),
  product: col("link to your product", "product", "demo, or presentation"),
  video: col("link to your video", "video"),
  clickFirst: col("click first", "instructions for the judge", "instructions"),
  repo: col("repositor", "source link"),
  tested: col("tested", "confirmation"),
  notes: col("anything the judges", "need to run", "additional comments", "comments for the judges"),
  time: col("completion time", "start time"),
};
/* `track` must not match "build track prompt": prefer an exact header. */
const exactTrack = header.findIndex((h) => h === "track");
if (exactTrack !== -1) C.track = exactTrack;
/* Email: Forms' own sign-in "Email" column wins over a typed "WSU
   email" question. */
const exactEmail = header.findIndex((h) => h === "email");
if (exactEmail !== -1) C.email = exactEmail;
/* Team: exact title first. When a renamed question has no exact "Team
   Name" title, fall back to the first header that contains "team name"
   but is not the "if not listed" fallback column. */
{
  let i = header.findIndex((h) => normalizeExactHeader(h) === "team name");
  if (i === -1) i = header.findIndex((h) => h.includes("team name") && !h.includes("not listed"));
  C.team = i === -1 ? null : i;
}
{
  const i = header.findIndex((h) => h.includes("not listed"));
  C.teamFallback = i === -1 ? null : i;
}
/* Submitter: fall back to Forms' own sign-in "Name" column. */
if (C.submitter === null) {
  const i = header.findIndex((h) => h === "name");
  if (i !== -1) C.submitter = i;
}

const required = ["team", "track", "product", "video"];
const missing = required.filter((k) => C[k] === null);
if (missing.length) {
  console.error("could not find columns for:", missing.join(", "));
  console.error("headers seen:", rows[0].join(" | "));
  process.exit(1);
}
const optionalTracked = ["clickFirst", "repo", "tested", "notes", "email", "submitter", "teamFallback"];
const optionalMissing = optionalTracked.filter((k) => C[k] === null);
if (optionalMissing.length) {
  console.error("not found in this export:", optionalMissing.join(", "));
}

const get = (r, k) => (C[k] === null ? "" : (r[C[k]] ?? "").trim());
const NOT_LISTED_TEXT = "my team is not listed";
const resolveTeam = (r) => {
  const teamCell = get(r, "team");
  if (!teamCell || teamCell.toLowerCase().includes(NOT_LISTED_TEXT)) return get(r, "teamFallback");
  return teamCell;
};
const promptId = (s) => {
  const m = s.match(/\b([BP])[\s-]?(\d)\b/i);
  return m ? `${m[1].toUpperCase()}-${m[2]}` : "";
};

const unnamedWarnings = [];

const allRaw = rows.slice(1).map((r, i) => {
  const trackRaw = get(r, "track").toLowerCase();
  const track = trackRaw.startsWith("pitch") ? "pitch" : "build";
  const promptRaw = track === "build" ? get(r, "buildPrompt") || get(r, "pitchPrompt") : get(r, "pitchPrompt") || get(r, "buildPrompt");
  const resolvedTeam = resolveTeam(r);
  const rowNumber = i + 1;
  /* A blank resolved team name (dropdown "not listed" with the fallback
     cell also blank) must never collapse two rows into one "" teamKey.
     Give each such row its own name and slug, keyed by row number. */
  let team = resolvedTeam;
  let teamKey;
  if (!team) {
    team = `Unnamed team (row ${rowNumber})`;
    teamKey = `${track}/unnamed-row-${rowNumber}`;
    unnamedWarnings.push(`Row ${rowNumber} has no team name; the judges will see "${team}". Fix the cell in Excel and re-upload.`);
  } else {
    teamKey = `${track}/${slugify(team)}`;
  }
  const completionRaw = get(r, "time");
  return {
    n: rowNumber,
    team,
    teamKey,
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
    tested: get(r, "tested").length > 0,
    notes: get(r, "notes"),
    submittedAt: completionRaw,
    _rawIndex: i,
    _completionMs: parseFormsDate(completionRaw),
  };
});

/* Duplicates: same team+track keeps the later completion time; if
   either time doesn't parse, the later row in the export wins. */
const groups = new Map();
for (const s of allRaw) {
  const arr = groups.get(s.teamKey);
  if (arr) arr.push(s);
  else groups.set(s.teamKey, [s]);
}
const droppedRaw = new Set();
for (const group of groups.values()) {
  if (group.length < 2) continue;
  let winner = group[0];
  for (const cur of group.slice(1)) {
    const bothParse = winner._completionMs !== null && cur._completionMs !== null;
    const curWins = bothParse ? cur._completionMs > winner._completionMs : cur._rawIndex > winner._rawIndex;
    if (curWins) winner = cur;
  }
  for (const s of group) {
    if (s !== winner) droppedRaw.add(s._rawIndex);
  }
}
const strip = ({ _rawIndex, _completionMs, ...rest }) => rest;

const submissions = allRaw
  .filter((s) => !droppedRaw.has(s._rawIndex))
  .map((s, i) => ({ ...strip(s), n: i + 1 }));

const finalNByTeamKey = new Map();
for (const s of submissions) finalNByTeamKey.set(s.teamKey, s.n);

const dropped = allRaw
  .filter((s) => droppedRaw.has(s._rawIndex))
  .map((s, i) => ({ ...strip(s), n: i + 1, duplicateOf: finalNByTeamKey.get(s.teamKey) }));

if (dropped.length) {
  for (const d of dropped) {
    const keptTime = submissions.find((s) => s.n === d.duplicateOf)?.submittedAt ?? "";
    console.error(`${d.team} submitted twice; keeping the entry completed ${keptTime || "later"}.`);
  }
}

const warnings = [...unnamedWarnings];
for (const s of submissions) {
  const pw = linkWarning("product link", s.team, s.product);
  if (pw) warnings.push(pw);
  const vw = linkWarning("video link", s.team, s.video);
  if (vw) warnings.push(vw);
}

/* One track per team: group the visible (post-dedup) submissions by
   slug alone, ignoring track. A slug present in both tracks gets
   flagged on both sides and cross-linked via `alsoIn`. */
const bySlug = new Map();
for (const s of submissions) {
  const slug = slugify(s.team);
  const arr = bySlug.get(slug);
  if (arr) arr.push(s);
  else bySlug.set(slug, [s]);
}
for (const group of bySlug.values()) {
  const buildSub = group.find((s) => s.track === "build");
  const pitchSub = group.find((s) => s.track === "pitch");
  if (!buildSub || !pitchSub) continue;
  buildSub.alsoIn = "pitch";
  pitchSub.alsoIn = "build";
  warnings.push(
    `"${buildSub.team}" is entered in both tracks. One track per team: delete one row in Excel and re-upload, or exclude one on the ranking page.`,
  );
}

for (const w of warnings) console.error(w);

const out = {
  generatedAt: new Date().toISOString(),
  source: basename(input),
  sample: /sample/i.test(basename(input)),
  count: submissions.length,
  submissions,
};
mkdirSync(resolve("public/judging"), { recursive: true });
writeFileSync(resolve("public/judging/submissions.json"), JSON.stringify(out, null, 2) + "\n");
console.log(
  `wrote public/judging/submissions.json: ${submissions.length} submissions ` +
    `(${submissions.filter((s) => s.track === "build").length} build, ` +
    `${submissions.filter((s) => s.track === "pitch").length} pitch)` +
    (out.sample ? " [SAMPLE]" : ""),
);
