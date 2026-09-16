/* The real Microsoft Forms export header, final form as of 2026-09-15,
   plus two real sample data rows (see chocolathon repo task notes).
   Reused by src/judge/mapRows.test.ts and any other test that needs a
   realistic export shape. */

export const FORMS_HEADER_2026_09_15 = [
  "Id",
  "Start time",
  "Completion time",
  "Email",
  "Name",
  "Team Name",
  "Team name, if not listed.",
  "Track",
  "Build Track Prompt",
  "Pitch Track Prompt",
  "In a few sentences, describe what you built or what you are recommending.",
  "Link to your product, demo, or presentation.",
  "Link to your video.",
  "Instructions for the judge.",
  "Repository or source link.",
  "Confirmation",
  "Additional comments for the judges.",
];

/* Row 1: Build Track, Global Scope. Product/video are not real URLs on
   purpose — this is also the fixture for the link-warning tests. */
export const FORMS_ROW_1_2026_09_15 = [
  "2",
  "9/15/26 21:05",
  "9/15/26 21:05",
  "y435u357@wichita.edu",
  "Michael Goldberg",
  "Global Scope",
  "",
  "Build Track",
  "B-2: Thermal Shipping Decision Engine",
  "",
  "Test ",
  "Test",
  "Trat",
  "Test",
  "Test",
  "I have tested both links in a private window, signed out, and the video is 3 minutes or less.;",
  "Test",
];

/* Row 2: Pitch Track, Sugar Is Sweet. Real URLs. */
export const FORMS_ROW_2_2026_09_15 = [
  "3",
  "9/15/26 21:08",
  "9/15/26 21:09",
  "y435u357@wichita.edu",
  "Michael Goldberg",
  "Sugar Is Sweet",
  "",
  "Pitch Track",
  "",
  "P-3: The Cocoa Price Squeeze",
  "Test",
  "https://hackathon.genai.works/event/open-agent-hackathon-2026",
  "https://youtu.be/JWhICz1QR8M?is=8YoLJSXG6nEfL5hn",
  "Test2",
  "Test",
  "I have tested both links in a private window, signed out, and the video is 3 minutes or less.",
  "Test2",
];

export const FORMS_ROWS_2026_09_15 = [FORMS_ROW_1_2026_09_15, FORMS_ROW_2_2026_09_15];
