#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   MAKE-CODES — turn the registration roster into competitor codes.

   Run this once, after registration closes on September 10.

     node pipeline/make-codes.mjs teams.txt

   `teams.txt` is one team name per line — paste the Team Name column
   straight out of the registration spreadsheet. Blank lines and
   duplicates are ignored.

   It prints two things:
     1. the COMPETITOR_CODES value to paste into Vercel
     2. a per-team list to mail-merge from

   Codes are deliberately readable, not strong: `cocoa-4718`. They are
   typed off a phone by a tired student, they are only worth anything
   for five weeks, and the thing behind them goes public in September
   anyway. Ambiguous characters are avoided by using digits only.

   Never commit the output. `*.local` is gitignored — write to
   `codes.local.txt` if you want it on disk.
   ═══════════════════════════════════════════════════════════════════ */

import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node pipeline/make-codes.mjs <teams.txt>");
  console.error("       one team name per line");
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(file, "utf8");
} catch {
  console.error(`Could not read ${file}`);
  process.exit(1);
}

/* Commas and colons are the COMPETITOR_CODES separators, so a team
   called "Ctrl, Alt, Defeat" would silently split into three entries.
   Strip them rather than fail at 11pm on September 10. */
const names = [
  ...new Set(
    raw
      .split("\n")
      .map((n) => n.trim().replace(/[,:]/g, " ").replace(/\s+/g, " "))
      .filter(Boolean),
  ),
];

if (names.length === 0) {
  console.error("No team names found.");
  process.exit(1);
}

const used = new Set();
function code() {
  for (;;) {
    const c = `cocoa-${randomInt(1000, 10000)}`;
    if (!used.has(c)) {
      used.add(c);
      return c;
    }
  }
}

const pairs = names.map((name) => ({ name, code: code() }));

console.log("\n═══ 1. Paste this as COMPETITOR_CODES in Vercel ═══\n");
console.log(pairs.map((p) => `${p.code}:${p.name}`).join(","));

console.log("\n\n═══ 2. Mail merge from this ═══\n");
const width = Math.max(...pairs.map((p) => p.name.length));
for (const p of pairs) {
  console.log(`${p.name.padEnd(width)}  ${p.code}`);
}

console.log(
  `\n${pairs.length} team${pairs.length === 1 ? "" : "s"}. ` +
    `Send each team ONLY its own code, plus the URL.\n`,
);
