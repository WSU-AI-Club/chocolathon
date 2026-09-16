#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   make-rehearsal — a fictional 30-team Microsoft Forms export for
   dress-rehearsing the judging system before the real form closes.

   Usage:
     node pipeline/make-rehearsal.mjs <out.xlsx>

   Writes one sheet with the exact 17-column header the real export
   uses (see src/judge/__fixtures__/forms-export-2026-09-15.ts; copied
   here as a literal because this file cannot import a .ts fixture)
   and 31 data rows: 30 fictional teams (18 Build, 12 Pitch, chocolate-
   flavored names, never a real team) plus one duplicate row for a
   Build team with a later Completion time, so the later row wins the
   same way it would on the real export. Feed the result to
   pipeline/make-judging.mjs the same way you would feed it a CSV
   exported from Excel: convert to CSV first.

   Rehearsal data never carries a real prompt title beyond ids that
   are already public, and every team name here is invented.
   ═══════════════════════════════════════════════════════════════════ */

import { resolve } from "node:path";
import * as XLSX from "xlsx";

const out = process.argv[2];
if (!out) {
  console.error("usage: node pipeline/make-rehearsal.mjs <out.xlsx>");
  process.exit(1);
}

/* Exact header from src/judge/__fixtures__/forms-export-2026-09-15.ts. */
const HEADER = [
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

const CONFIRM = "I have tested both links in a private window, signed out, and the video is 3 minutes or less.";

const BUILD_TEAMS = [
  ["Cocoa Compilers", "Cocoa Compilers built a kiosk app that scans a chocolate bar's wrapper and estimates its tempering quality from a photo. A small on-device model flags snap and bloom defects before a batch ships."],
  ["Ganache Gang", "Ganache Gang built a smart thermometer clip that streams ganache temperature to a phone during mixing. It buzzes the moment the mixture drifts out of the target range for a stable emulsion."],
  ["Tempered Logic", "Tempered Logic built a scheduling tool that times chocolate tempering steps against a kitchen's oven and cooling rack availability. It reorders batches automatically when a step runs long."],
  ["Bitter Byte Brigade", "Bitter Byte Brigade built an inventory tracker for a small chocolatier that flags cacao percentage mismatches between recipe cards and supplier invoices. It also prints reorder labels for low stock."],
  ["Praline Pipeline", "Praline Pipeline built a conveyor simulation that lays out praline molds to minimize wasted chocolate at the edges of a sheet. The tool exports a cutting guide a machine operator can follow by hand."],
  ["Truffle Stack", "Truffle Stack built a recipe versioning app so a chocolate shop can track which truffle formula shipped in which batch. It rolls back a recipe instantly if a customer reports an allergy mismatch."],
  ["Fondant Forge", "Fondant Forge built a color-mixing calculator that predicts the food coloring ratio needed to hit a target fondant shade. It remembers past batches so a decorator can repeat a color exactly."],
  ["Cacao Coders", "Cacao Coders built a supply chain dashboard that traces a bag of cacao beans from farm cooperative to roaster. Judges can click any batch to see its full custody chain."],
  ["Molten Core Devs", "Molten Core Devs built a pour-monitoring sensor for chocolate fountains that predicts clogs before they happen. A small display warns staff to add heat or reduce flow."],
  ["Dark Chocolate Daemons", "Dark Chocolate Daemons built a background service that watches a commercial tempering machine's logs and pages a technician the moment a sensor reading looks wrong. It has caught two simulated faults in testing."],
  ["Nib Ninjas", "Nib Ninjas built a roasting profile editor for cacao nibs that graphs time against temperature and flags a scorch risk. Roasters can save a profile and replay it on the next batch."],
  ["Couverture Crew", "Couverture Crew built a viscosity estimator for couverture chocolate using a phone's camera to watch how it drips off a spatula. It suggests how much cocoa butter to add to hit a target flow."],
  ["Bonbon Builders", "Bonbon Builders built a mold inventory app that matches bonbon shell molds to filling recipes and flags incompatible pairings. It also tracks which molds are due for replacement."],
  ["Silky Syntax", "Silky Syntax built a texture-scoring tool that has tasters rate mouthfeel on a shared rubric and averages the results per batch. It highlights when one taster's scores drift from the group."],
  ["Roasted Bean Robotics", "Roasted Bean Robotics built a small robotic arm controller that sorts roasted cacao beans by size before grinding. It rejects beans outside a configurable size window."],
  ["Cocoa Butter Backend", "Cocoa Butter Backend built an API that tracks cocoa butter stock across three storage temperatures and warns when a batch is close to its use-by date. A nightly job emails the day's expiring lots."],
  ["Snap Point Squad", "Snap Point Squad built a phone app that records the sound of a chocolate bar snapping and estimates temper quality from the audio signature. It compares the sound against a reference library."],
  ["Melangeur Machines", "Melangeur Machines built a control panel for a small melangeur that logs grind time and particle size targets per recipe. It alerts an operator when a batch is ready to conch."],
];

const PITCH_TEAMS = [
  ["Sweet Talk Strategy", "Sweet Talk Strategy pitched a subscription box that pairs small-batch chocolate with a printed tasting guide written by the maker. They argue local chocolatiers can reach new customers without giving up margin to a marketplace."],
  ["Cocoa Pitch Perfect", "Cocoa Pitch Perfect pitched a wholesale marketplace that matches small chocolate makers with independent coffee shops looking for a dessert case. Their model takes a flat listing fee instead of a percentage of sales."],
  ["Confection Consultants", "Confection Consultants pitched a consulting package that audits a bakery's dessert case for margin leaks and recommends which items to cut. They walked through a sample audit from a fictional downtown bakery."],
  ["Bean to Bar Believers", "Bean to Bar Believers pitched a direct trade platform connecting bean-to-bar makers with a single cacao cooperative. They argue traceability is the differentiator buyers will pay a premium for."],
  ["Velvet Value Prop", "Velvet Value Prop pitched a loyalty program built specifically for chocolate shops that rewards repeat visits with early access to seasonal flavors. They project it lifts repeat purchase rate within two quarters."],
  ["Chocolatiers United", "Chocolatiers United pitched a shared shipping cooperative so small chocolatiers can split refrigerated freight costs during summer months. They estimate meaningful savings per shipment for a mid-size shop."],
  ["Sugar Rush Strategists", "Sugar Rush Strategists pitched a pricing calculator that helps a chocolatier set wholesale prices based on ingredient cost swings. They demoed it against a cocoa price spike scenario."],
  ["Wichita Whisk", "Wichita Whisk pitched a pop-up event series pairing local chocolatiers with Wichita coffee roasters for one-night tastings. They argue it builds a local following before either business commits to a storefront."],
  ["Artisan Bar Advisors", "Artisan Bar Advisors pitched a certification mark for bean-to-bar makers who disclose their full ingredient sourcing. They argue the mark helps a shopper tell a real bean-to-bar bar from a relabeled couverture bar."],
  ["Cacao Capitalists", "Cacao Capitalists pitched a micro-lending fund for small chocolate makers who need working capital to buy cacao ahead of a price increase. They walked through underwriting criteria for a fictional applicant."],
  ["Smooth Operator Sweets", "Smooth Operator Sweets pitched a scheduling service for chocolate makers who sell at farmers markets, matching booth staff to open shifts. They argue it cuts no-shows during peak season."],
  ["Foil Wrapped Forecast", "Foil Wrapped Forecast pitched a demand forecasting tool that predicts how many chocolate bars a shop should stock ahead of a holiday weekend. They showed a sample forecast for a fictional Valentine's Day rush."],
];

const DUPLICATE_DESCRIPTION = "Cocoa Compilers resubmitted after fixing a calibration bug in the tempering-quality model that was misreading bloom on darker bars. The kiosk flow and photo capture step are unchanged from the first submission.";

const VIDEOS = [
  "https://youtu.be/JWhICz1QR8M",
  "https://vimeo.com/76979871",
  "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "https://drive.google.com/file/d/1AbC_dEf-GhI/view?usp=sharing",
  "https://www.loom.com/share/0abc123def4567890abc123def456789",
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fmtTime(minutesFromMidnight) {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = ((minutesFromMidnight % 60) + 60) % 60;
  return `9/19/26 ${h}:${String(m).padStart(2, "0")}`;
}

/* Row order: 18 Build teams, then 12 Pitch teams, then one duplicate
   of the first Build team (Cocoa Compilers) appended last so its
   completion time is the latest in the sheet and it wins the dedupe. */
const teams = [
  ...BUILD_TEAMS.map(([name, description]) => ({ track: "Build Track", name, description })),
  ...PITCH_TEAMS.map(([name, description]) => ({ track: "Pitch Track", name, description })),
];
teams.push({ track: teams[0].track, name: teams[0].name, description: DUPLICATE_DESCRIPTION });

const START_MIN = 9 * 60 + 12; // 9:12
const END_MIN = 13 * 60 + 58; // 13:58
const LAST = teams.length - 1; // 30

/* Special-case row indices (0-based), chosen distinct from each other
   and from the duplicate row (index 30). */
const BAD_VIDEO_IDX = 4; // Praline Pipeline
const SHAREPOINT_IDX = 7; // Cacao Coders
const LOCALHOST_IDX = 12; // Bonbon Builders
const NOT_LISTED_IDX = 20; // Confection Consultants
const NO_CONFIRM_IDX = new Set([15, 25]); // Cocoa Butter Backend, Cacao Capitalists

const sheetRows = teams.map((t, i) => {
  const isBuild = t.track === "Build Track";
  const completionMin = Math.round(START_MIN + (i * (END_MIN - START_MIN)) / LAST);
  const startMin = completionMin - 4 - (i % 5);

  let video = VIDEOS[i % VIDEOS.length];
  if (i === BAD_VIDEO_IDX) video = "Trat";

  let product = `https://example.com/${slugify(t.name)}`;
  if (i === SHAREPOINT_IDX) product = "https://wichitastate-my.sharepoint.com/:v:/g/personal/x/abc";
  if (i === LOCALHOST_IDX) product = "http://localhost:3000";

  let teamNameCell = t.name;
  let teamFallback = "";
  if (i === NOT_LISTED_IDX) {
    teamNameCell = "My team is not listed";
    teamFallback = t.name;
  }

  const fillExtra = i % 2 === 0;
  const instructions = fillExtra ? `Open the ${isBuild ? "demo" : "deck"} link first; it has the version we want scored.` : "";
  const comments = fillExtra ? `Thanks for judging ${t.name}. Happy to answer follow-up questions live.` : "";
  const confirmation = NO_CONFIRM_IDX.has(i) ? "" : CONFIRM;

  return [
    String(i + 1), // Id
    fmtTime(startMin), // Start time
    fmtTime(completionMin), // Completion time
    "y435u357@wichita.edu", // Email
    "Rehearsal Row", // Name
    teamNameCell, // Team Name
    teamFallback, // Team name, if not listed.
    t.track, // Track
    isBuild ? "B-0: Rehearsal prompt" : "", // Build Track Prompt
    isBuild ? "" : "P-0: Rehearsal prompt", // Pitch Track Prompt
    t.description, // description sentences
    product, // Link to your product, demo, or presentation.
    video, // Link to your video.
    instructions, // Instructions for the judge.
    "", // Repository or source link.
    confirmation, // Confirmation
    comments, // Additional comments for the judges.
  ];
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([HEADER, ...sheetRows]), "Responses");
XLSX.writeFile(wb, resolve(out));

const buildCount = teams.filter((t) => t.track === "Build Track").length - 1; // minus the duplicate
const pitchCount = teams.filter((t) => t.track === "Pitch Track").length;
console.log(`wrote ${out}: ${sheetRows.length} rows (${buildCount} build teams, ${pitchCount} pitch teams, 1 duplicate)`);
