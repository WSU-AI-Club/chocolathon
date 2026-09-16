import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { mapRows } from "./mapRows";
import {
  FORMS_HEADER_2026_09_15,
  FORMS_ROW_1_2026_09_15,
  FORMS_ROW_2_2026_09_15,
  FORMS_ROWS_2026_09_15,
} from "./__fixtures__/forms-export-2026-09-15";

/* A minimal RFC-4180 parser, matching pipeline/make-judging.mjs, used
   only to load the real CSV fixtures for these tests. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
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

describe("mapRows: real 2026-09-15 Forms export", () => {
  const { judging, missing, dropped, warnings, optionalMissing } = mapRows(
    FORMS_HEADER_2026_09_15,
    FORMS_ROWS_2026_09_15,
    "responses.csv",
  );

  it("finds all required columns", () => {
    expect(missing).toEqual([]);
  });

  it("finds all optional columns", () => {
    expect(optionalMissing).toEqual([]);
  });

  it("maps row 1 (Global Scope, Build)", () => {
    const s = judging.submissions.find((x) => x.team === "Global Scope");
    expect(s).toBeTruthy();
    expect(s?.track).toBe("build");
    expect(s?.email).toBe("y435u357@wichita.edu");
    expect(s?.submitter).toBe("Michael Goldberg");
    expect(s?.clickFirst).toBe("Test");
    expect(s?.notes).toBe("Test");
    expect(s?.tested).toBe(true);
    expect(s?.teamKey).toBe("build/global-scope");
  });

  it("maps row 2 (Sugar Is Sweet, Pitch)", () => {
    const s = judging.submissions.find((x) => x.team === "Sugar Is Sweet");
    expect(s).toBeTruthy();
    expect(s?.track).toBe("pitch");
    expect(s?.email).toBe("y435u357@wichita.edu");
    expect(s?.submitter).toBe("Michael Goldberg");
    expect(s?.clickFirst).toBe("Test2");
    expect(s?.notes).toBe("Test2");
    expect(s?.tested).toBe(true);
    expect(s?.teamKey).toBe("pitch/sugar-is-sweet");
  });

  it("drops nothing and warns about the two bad links", () => {
    expect(dropped).toEqual([]);
    expect(warnings).toContain('Global Scope: video link is not a web address ("Trat").');
    expect(warnings).toContain('Global Scope: product link is not a web address ("Test").');
    expect(warnings.some((w) => w.startsWith("Sugar Is Sweet"))).toBe(false);
  });
});

describe("mapRows: Team Name1 header variant", () => {
  it("still matches the team column exactly", () => {
    const header = FORMS_HEADER_2026_09_15.map((h) => (h === "Team Name" ? "Team Name1" : h));
    const { judging, missing } = mapRows(header, [FORMS_ROW_1_2026_09_15], "responses.csv");
    expect(missing).toEqual([]);
    expect(judging.submissions[0].team).toBe("Global Scope");
  });

  it("never substring-matches the fallback column as the team column", () => {
    const header = ["Team Name, if not listed."];
    const { missing } = mapRows(header, [[""]], "x.csv");
    expect(missing).toContain("team");
  });
});

describe("mapRows: team fallback", () => {
  const header = [...FORMS_HEADER_2026_09_15];

  it("uses the fallback when the team cell is empty", () => {
    const row = [...FORMS_ROW_1_2026_09_15];
    row[5] = ""; // Team Name
    row[6] = "Chocolate Collective"; // Team name, if not listed.
    const { judging } = mapRows(header, [row], "x.csv");
    expect(judging.submissions[0].team).toBe("Chocolate Collective");
  });

  it("uses the fallback when the team cell is the not-listed placeholder", () => {
    const row = [...FORMS_ROW_1_2026_09_15];
    row[5] = "My team is not listed";
    row[6] = "Chocolate Collective";
    const { judging } = mapRows(header, [row], "x.csv");
    expect(judging.submissions[0].team).toBe("Chocolate Collective");
  });
});

describe("mapRows: duplicate teams", () => {
  it("keeps the later completion time and drops the other with duplicateOf set", () => {
    const early = [...FORMS_ROW_2_2026_09_15]; // Sugar Is Sweet, completed 21:09
    const later = [...FORMS_ROW_2_2026_09_15];
    later[0] = "4";
    later[2] = "9/15/26 21:15"; // later completion time
    later[10] = "Second attempt";

    const { judging, dropped } = mapRows(FORMS_HEADER_2026_09_15, [early, later], "responses.csv");

    expect(judging.submissions).toHaveLength(1);
    expect(judging.submissions[0].sentence).toBe("Second attempt");
    expect(judging.submissions[0].submittedAt).toBe("9/15/26 21:15");

    expect(dropped).toHaveLength(1);
    expect(dropped[0].team).toBe("Sugar Is Sweet");
    expect(dropped[0].duplicateOf).toBe(judging.submissions[0].n);
  });

  it("falls back to export order when a completion time doesn't parse", () => {
    const first = [...FORMS_ROW_2_2026_09_15];
    first[2] = "not a date";
    const second = [...FORMS_ROW_2_2026_09_15];
    second[0] = "4";
    second[2] = "also not a date";
    second[10] = "This one is later in the file";

    const { judging } = mapRows(FORMS_HEADER_2026_09_15, [first, second], "responses.csv");
    expect(judging.submissions).toHaveLength(1);
    expect(judging.submissions[0].sentence).toBe("This one is later in the file");
  });
});

describe("mapRows: link warnings", () => {
  it("flags SharePoint/OneDrive links", () => {
    const row = [...FORMS_ROW_2_2026_09_15];
    row[11] = "https://mycompany.sharepoint.com/demo";
    row[12] = "https://1drv.ms/v/abc123";
    const { warnings } = mapRows(FORMS_HEADER_2026_09_15, [row], "responses.csv");
    expect(warnings.some((w) => w.includes("SharePoint/OneDrive") && w.includes("product link"))).toBe(true);
    expect(warnings.some((w) => w.includes("SharePoint/OneDrive") && w.includes("video link"))).toBe(true);
  });

  it("flags localhost links", () => {
    const row = [...FORMS_ROW_2_2026_09_15];
    row[11] = "http://localhost:3000";
    const { warnings } = mapRows(FORMS_HEADER_2026_09_15, [row], "responses.csv");
    expect(warnings.some((w) => w.includes("localhost"))).toBe(true);
  });

  it("does not warn on a valid https link", () => {
    const { warnings } = mapRows(FORMS_HEADER_2026_09_15, [FORMS_ROW_2_2026_09_15], "responses.csv");
    expect(warnings).toEqual([]);
  });
});

describe("mapRows: optionalMissing", () => {
  it("reports clickFirst missing when the Instructions column is removed", () => {
    const idx = FORMS_HEADER_2026_09_15.indexOf("Instructions for the judge.");
    const header = FORMS_HEADER_2026_09_15.filter((_, i) => i !== idx);
    const row = FORMS_ROW_1_2026_09_15.filter((_, i) => i !== idx);
    const { optionalMissing, missing } = mapRows(header, [row], "responses.csv");
    expect(missing).toEqual([]);
    expect(optionalMissing).toContain("clickFirst");
  });
});

describe("mapRows: old sample-responses.csv still maps", () => {
  const csvPath = fileURLToPath(new URL("../../pipeline/sample-responses.csv", import.meta.url));
  const rows = parseCsv(readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
  const [header, ...data] = rows;

  it("finds every required column", () => {
    const { missing } = mapRows(header, data, "sample-responses.csv");
    expect(missing).toEqual([]);
  });

  it("maps the first sample row sensibly", () => {
    const { judging } = mapRows(header, data, "sample-responses.csv");
    const alpha = judging.submissions.find((s) => s.team === "Sample Team Alpha");
    expect(alpha).toBeTruthy();
    expect(alpha?.track).toBe("build");
    expect(alpha?.tested).toBe(true);
    expect(alpha?.clickFirst).toBe("The first button on the home screen.");
    expect(alpha?.teamKey).toBe("build/sample-team-alpha");
  });
});
