#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   make-judging — turn the submission form's export into the judge page.

   ON THE DAY (2:15 PM, the moment the form closes):

     1. In Microsoft Forms, open the submission form → Responses →
        "Open in Excel". Save that workbook as CSV (File → Save As →
        CSV UTF-8). Call it responses.csv.
     2. From the repo root:
           node pipeline/make-judging.mjs responses.csv
        It writes public/judging/submissions.json.
     3. git add public/judging && git commit -m "Judging: 2:15 export"
        && git push
        The deploy takes about fifteen seconds. The judge page reads the
        JSON on load, so judges refresh once.

   Columns are matched by keyword, not position, so reordering the form
   does not break this. If a column is missing the script says which.

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

const raw = readFileSync(resolve(input), "utf8").replace(/^﻿/, "");
const rows = parseCsv(raw);
if (rows.length < 2) {
  console.error("no data rows in", input);
  process.exit(1);
}
const header = rows[0].map((h) => h.trim().toLowerCase());

/* Find a column by the first keyword that matches; report the miss. */
function col(name, ...keywords) {
  for (const k of keywords) {
    const i = header.findIndex((h) => h.includes(k));
    if (i !== -1) return i;
  }
  return null;
}
const C = {
  team: col("team name", "team name"),
  submitter: col("submitter name", "submitter name"),
  email: col("email", "wsu email", "email"),
  track: col("track", "track"),
  buildPrompt: col("build prompt", "build track prompt"),
  pitchPrompt: col("pitch prompt", "pitch track prompt"),
  sentence: col("one sentence", "one sentence", "describe what you built", "describe"),
  product: col("product link", "link to your product"),
  video: col("video link", "link to your video"),
  clickFirst: col("click first", "click first"),
  repo: col("repository", "repositor", "source link"),
  tested: col("tested", "tested"),
  notes: col("notes", "anything the judges", "need to run"),
  time: col("completion time", "completion time", "start time"),
};
const required = ["team", "track", "product", "video"];
const missing = required.filter((k) => C[k] === null);
if (missing.length) {
  console.error("could not find columns for:", missing.join(", "));
  console.error("headers seen:", rows[0].join(" | "));
  process.exit(1);
}
/* `track` must not match "build track prompt": prefer an exact header. */
const exactTrack = header.findIndex((h) => h === "track");
if (exactTrack !== -1) C.track = exactTrack;

const get = (r, k) => (C[k] === null ? "" : (r[C[k]] ?? "").trim());
const promptId = (s) => {
  const m = s.match(/\b([BP])[\s-]?(\d)\b/i);
  return m ? `${m[1].toUpperCase()}-${m[2]}` : "";
};

const submissions = rows.slice(1).map((r, i) => {
  const trackRaw = get(r, "track").toLowerCase();
  const track = trackRaw.startsWith("pitch") ? "pitch" : "build";
  const promptRaw = track === "build" ? get(r, "buildPrompt") || get(r, "pitchPrompt") : get(r, "pitchPrompt") || get(r, "buildPrompt");
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
