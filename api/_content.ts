/* ═══════════════════════════════════════════════════════════════════
   PROMPTS PAGE CONTENT — SERVER ONLY. NEVER IMPORT THIS FROM src/.

   This file is compiled into the Vercel serverless functions, not into
   the browser bundle. That is the whole point: before the release clock
   turns over, the challenge prompts do not exist anywhere a visitor can
   reach them, including View Source and the network tab. Import it from
   `src/` even once and the countdown is theatre.

   One gate protects the prompts (the team-code gate was dropped on
   2026-09-06 — the page is public, no logins):
     the release clock — PROMPTS_RELEASE_AT, default Sep 14 midnight CT

   Nobody has to be at a keyboard on the 14th to publish them.

   The prompt text is the .docx `Chocolathon_Challenge_Prompts` word for
   word (2026-09-06). Edit the document, then mirror the edit here; do
   not improve the copy in one place only.
   ═══════════════════════════════════════════════════════════════════ */

export type Block =
  | { kind: "text"; label: string; body: string }
  | { kind: "list"; label: string; items: string[] };

export type Prompt = {
  id: string;
  track: "build" | "pitch";
  title: string;
  /* One line shown in the prompt index before you open it. */
  teaser: string;
  wildcard?: boolean;
  blocks: Block[];
};

/* ───────────────────────────── BUILD TRACK ─────────────────────────── */

const BUILD: Prompt[] = [
  {
    id: "B-1",
    track: "build",
    title: "Chocolate Vision — Know Every Piece in Every Box",
    teaser: "Identify truffle varieties from a photo and log what is in a box.",
    blocks: [
      {
        kind: "text",
        label: "Problem",
        body:
          "Cocoa Dolce has no data on which truffles go into which box. Each " +
          "variety is hand-painted with a distinct color palette (splatters, " +
          "swirls, splashes), but no two pieces are identical.",
      },
      {
        kind: "text",
        label: "Challenge",
        body:
          "Build a proof-of-concept that identifies truffle varieties from a " +
          "photo and logs box contents. Start with color-palette matching on a " +
          "handful of varieties under good lighting — reliably classifying 3–4 " +
          "varieties is a win. This is the hardest, most research-heavy prompt " +
          "on the board.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "Working demo classifying at least a few varieties, with stated accuracy",
          "Simple capture workflow a packer could realistically use (phone or fixed camera)",
          "Structured output (JSON/CSV per box) that could feed Odoo inventory",
          "Honest documentation of where accuracy breaks down (lighting, similar palettes, pattern overlap)",
        ],
      },
      {
        kind: "text",
        label: "Stretch goal",
        body:
          "Pattern recognition beyond color, or flagging boxes that deviate from " +
          "the expected assortment before shipping.",
      },
    ],
  },
  {
    id: "B-2",
    track: "build",
    title: "Thermal Shipping Decision Engine",
    teaser: "Decide the thermal packaging for every order from the forecast, automatically.",
    blocks: [
      {
        kind: "text",
        label: "Problem",
        body:
          "Each day, the shipping team manually checks zip codes and " +
          "temperatures to decide: no thermal, single thermal, or double thermal " +
          "with ice packs. It works, but one wrong call means melted product.",
      },
      {
        kind: "text",
        label: "Challenge",
        body:
          "Automate the decision. Build a tool that takes destination zip codes, " +
          "pulls origin/destination forecasts for the transit window, applies " +
          "thermal thresholds, and outputs a daily pack list per order.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "Working tool that takes a batch of zip codes (or a Shopify order export) and returns thermal decisions",
          "Configurable temperature thresholds",
          "Clear daily summary view the packing team can print or view on a tablet",
          "Handling for multi-day transit (worst-case temperature across the window, not just ship day)",
          "Shipping timeline guidance (how long shipping should take)",
        ],
      },
      {
        kind: "text",
        label: "Stretch goal",
        body: "Estimate daily ice-pack and thermal-liner cost.",
      },
    ],
  },
  {
    id: "B-3",
    track: "build",
    title: "Design-Your-Box — Visual Corporate Order Builder",
    teaser: "A drag-and-drop box configurator for corporate orders.",
    blocks: [
      {
        kind: "text",
        label: "Problem",
        body:
          "Direct-to-consumer customers get an online visual box builder. " +
          "Corporate clients placing 75,000-piece orders get a PDF and a long " +
          "email thread to specify logo chocolate placement.",
      },
      {
        kind: "text",
        label: "Challenge",
        body:
          "Build a web-based visual box configurator for corporate orders — pick " +
          "a box size, drag chocolates (including logo pieces) into position, " +
          "choose ribbon/card/band options, and output a client-facing preview " +
          "plus a production spec.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "Working drag-and-drop box builder with at least two box sizes",
          "Placement rules the tool enforces or suggests (e.g., logo pieces front-center)",
          "Shareable visual proof the concierge team can send for client approval",
          "Machine-readable spec export for production",
        ],
      },
      {
        kind: "text",
        label: "Stretch goal",
        body:
          "Brand-color matching — upload a logo, get suggested chocolate color " +
          "palettes.",
      },
    ],
  },
  {
    id: "B-4",
    track: "build",
    title: "Wildcard — Build Something They Don’t Know They Need",
    teaser: "Your own working tool for a real Cocoa Dolce problem or opportunity.",
    wildcard: true,
    blocks: [
      {
        kind: "text",
        label: "Challenge",
        body:
          "Build a working tool that solves a real Cocoa Dolce problem or opens " +
          "a real opportunity — grounded in how their business actually runs " +
          "(production, packaging, shipping, ordering, retail, or customer " +
          "experience). It should be something Cocoa Dolce could actually use, " +
          "not a generic app with a chocolate label.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "A working build (Lovable or your own stack), demoable Saturday",
          "A clear, one-sentence answer to “what Cocoa Dolce problem does this solve?”",
          "Evidence you understood their business specifically",
        ],
      },
      {
        kind: "text",
        label: "The one rule",
        body:
          "If a judge can’t tell why Cocoa Dolce specifically would want this, it " +
          "belongs in a different hackathon.",
      },
    ],
  },
];

/* ───────────────────────────── PITCH TRACK ─────────────────────────── */

const PITCH: Prompt[] = [
  {
    id: "P-1",
    track: "pitch",
    title: "The Mold Bottleneck — Make the Case for a Fix",
    teaser: "Cost the manual mold-polishing process and make the case for replacing it.",
    blocks: [
      {
        kind: "text",
        label: "Problem",
        body:
          "Polycarbonate molds affect chocolate shine quality after every run. " +
          "The current fix is manual — alcohol wipe, rinse, wash, hand-polish — " +
          "hundreds of molds, a whole team, half a day, every cycle.",
      },
      {
        kind: "text",
        label: "Challenge",
        body:
          "Build the business case for changing the process. Research real " +
          "alternatives (machine agitators, ultrasonic or chemical baths, what " +
          "other chocolatiers do, material-science limits on polycarbonate) and " +
          "make a recommendation with the labor and capacity math behind it: " +
          "what the manual process costs, what the fix is, what the payback " +
          "looks like.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "A recommendation backed by real, sourced options (vendors, models, rough costs — verifiable)",
          "The cost of the status quo in labor-hours and lost capacity, especially in peak season",
          "A payback and risk read: mold lifespan, food safety, finish quality",
          "A pilot Cocoa Dolce could run within one quarter",
        ],
      },
      {
        kind: "text",
        label: "How Lovable helps",
        body:
          "Build an interactive payback calculator (adjust labor hours and " +
          "equipment cost, watch the break-even move) or a clean visual one-pager " +
          "comparing current vs. proposed process.",
      },
    ],
  },
  {
    id: "P-2",
    track: "pitch",
    title: "Own the Off-Peak — Revenue Beyond the Holidays",
    teaser: "Pitch a revenue-driving concept for the slow summer months.",
    blocks: [
      {
        kind: "text",
        label: "Problem",
        body:
          "Summer is Cocoa Dolce’s lightest season. Leadership wants to build " +
          "off-peak revenue rather than rely on an already-bottlenecked December. " +
          "A recent hotel turn-down chocolate program (75,000–100,000 pieces) " +
          "showed what one B2B concept can unlock.",
      },
      {
        kind: "text",
        label: "Challenge",
        body:
          "Pitch a revenue-driving concept for the off-peak months — a seasonal " +
          "event, brand activation, subscription, new B2B product line, or " +
          "experience. Think like a brand builder, not just a marketer.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "A fully developed concept: audience, positioning, pricing, revenue model",
          "An operating plan that fits slow-season production capacity",
          "Financial projections with stated, defensible assumptions",
          "A launch timeline and marketing plan their current team could run",
        ],
      },
      {
        kind: "text",
        label: "How Lovable helps",
        body:
          "Build the thing your pitch is about — a mock landing page for the " +
          "subscription, a booking page for the event, a B2B microsite for the " +
          "new product line. A judge who can click through your idea believes it " +
          "more.",
      },
    ],
  },
  {
    id: "P-3",
    track: "pitch",
    title: "The Cocoa Price Squeeze",
    teaser: "How a premium chocolatier should navigate cocoa prices that have tripled.",
    blocks: [
      {
        kind: "text",
        label: "Problem",
        body:
          "Cocoa prices have roughly tripled in two years. Many chocolatiers are " +
          "shrinking pieces or cutting quality in response — Cocoa Dolce went the " +
          "other way and made pieces bigger, betting on quality as the brand.",
      },
      {
        kind: "text",
        label: "Challenge",
        body:
          "Build the business case for how a premium chocolatier should navigate " +
          "sustained cocoa inflation — pricing, product mix, sourcing, and hedging " +
          "— without eroding the brand promise.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "A verifiable market analysis of cocoa pricing and forward outlook",
          "A pricing and product-mix strategy with margin modeling",
          "An evaluation of sourcing and hedging levers realistic for a company this size",
          "Clear guidance on what NOT to do — moves that would damage the brand",
        ],
      },
      {
        kind: "text",
        label: "How Lovable helps",
        body:
          "Build a pricing calculator where leadership can adjust cocoa cost, " +
          "piece size, and price, and watch margin and brand-positioning move " +
          "together — more persuasive than a static spreadsheet.",
      },
    ],
  },
  {
    id: "P-4",
    track: "pitch",
    title: "Wildcard — Pitch the Move They Haven’t Made",
    teaser: "The business case for a strategic move Cocoa Dolce could actually make.",
    wildcard: true,
    blocks: [
      {
        kind: "text",
        label: "Challenge",
        body:
          "Build the business case for a strategic move Cocoa Dolce could " +
          "actually make — a market to enter, a channel to open, a partnership, a " +
          "pricing or positioning shift, an operational bet. It should be grounded " +
          "in their actual business and a decision they could imagine funding, " +
          "not a generic strategy deck with a chocolate label.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "A clear, one-sentence answer to “what should Cocoa Dolce do, and why now?”",
          "A recommendation backed by real, sourced evidence — market data, costs, comparables, all verifiable",
          "The math behind it: cost, return, risk",
          "Evidence you understood their business specifically",
        ],
      },
      {
        kind: "text",
        label: "The one rule",
        body:
          "If a judge can’t tell why Cocoa Dolce specifically would act on this, " +
          "it belongs in a different hackathon.",
      },
      {
        kind: "text",
        label: "How Lovable helps",
        body:
          "Build an interactive model a judge can adjust, a clean visual " +
          "one-pager of the proposed move, or a mock page that makes the concept " +
          "real enough to sell from the stage.",
      },
    ],
  },
];

export const PROMPTS: Prompt[] = [...BUILD, ...PITCH];

/* ═══════════════════════════════════════════════════════════════════
   THE BRIEFING — instructions, rules, schedule, submission, FAQ.

   Unlike the prompts, this is unlocked the moment a team logs in. It is
   still behind the gate (it is competitor-facing, not marketing), but it
   is not on the release clock: teams need the rules the day they get
   their code, not on September 14.

   Every fact here traces to the Master Document or the decisions log.
   Anything genuinely undecided is marked TBA rather than invented —
   do not replace a TBA with a guess.
   ═══════════════════════════════════════════════════════════════════ */

export type Section = {
  id: string;
  nav: string;
  title: string;
  intro?: string;
  blocks: Block[];
};

/* Three lines above the prompts. The old "Start here" section is this. */
export const PROMPTS_INTRO =
  "Eight prompts, four per track. Pick one. You choose your track when you " +
  "submit on the 19th, so read both sides.";

export const RUN_OF_DAY: { time: string; what: string; who?: string; flag?: boolean }[] = [
  { time: "8:30 AM", what: "Doors open. Coffee, pastries, Cocoa Dolce chocolates." },
  { time: "9:15 AM", what: "Opening ceremony" },
  { time: "9:30 AM", what: "Teams work and refine" },
  {
    time: "11:30 AM",
    what: "Session 1: Open Source, Open Weights, Open Questions",
    who: "Fareeha Amber Ansari, AI Governance Lead, Cargill",
  },
  { time: "12:15 PM", what: "Lunch, by Jimmy John’s" },
  { time: "1:00 PM", what: "Submissions open", flag: true },
  { time: "2:15 PM", what: "Submissions close. Hard cutoff.", flag: true },
  { time: "2:30 PM", what: "Session 2, during preliminary judging", who: "Speaker to be announced" },
  { time: "3:45 PM", what: "Final presentations. Open to the public.", flag: true },
  { time: "4:45 PM", what: "Winners announced" },
  { time: "5:00 PM", what: "Pictures and wrap" },
];

/* Every section is a budget: one intro line and the fewest bullets that
   answer the question. Anything genuinely undecided is marked "to be
   announced" rather than invented. */
export const SECTIONS: Section[] = [
  {
    id: "tracks",
    nav: "Tracks",
    title: "Build or Pitch.",
    intro:
      "Same problems, two ways to answer. Each track is judged on its own; a " +
      "product is never scored against a recommendation.",
    blocks: [
      {
        kind: "list",
        label: "Build Track — ship something that works",
        items: [
          "A working product or prototype Cocoa Dolce could actually use",
          "You submit the product, a video, and a demo",
          "Judged on how useful it is and how well it is built",
          "$700 scholarship to the winning team, plus a big box of Cocoa Dolce chocolates",
        ],
      },
      {
        kind: "list",
        label: "Pitch Track — make the case",
        items: [
          "A recommendation Cocoa Dolce could act on, backed by real evidence",
          "You submit a pitch video and a demo that makes the idea tangible",
          "Judged on the argument and the evidence behind it",
          "$500 scholarship to the winning team, plus a big box of Cocoa Dolce chocolates",
        ],
      },
      {
        kind: "text",
        label: "Prizes",
        body:
          "Build pays more because it is the heavier lift. Second place in each " +
          "track takes home the same box of chocolates. $1,200 in scholarships, " +
          "four winning teams. AI is optional in both tracks; every team gets " +
          "Lovable credits because Lovable sponsors the event.",
      },
    ],
  },
  {
    id: "schedule",
    nav: "Schedule",
    title: "Saturday, September 19.",
    intro:
      "Woolsey Hall, WSU. Doors at 8:30 AM, wrap at 5:00 PM, food all day. " +
      "Bring your laptop, charger, student ID, and links already tested.",
    blocks: [
      {
        kind: "text",
        label: "Backed by the Barton School",
        body:
          "The room at Woolsey Hall is supported by the Office of Career and " +
          "Professional Development. Timing may shift by a few minutes; this " +
          "page is the version of record.",
      },
    ],
  },
  {
    id: "judges",
    nav: "Judges",
    title: "Who decides.",
    intro:
      "Two rounds. Local AI industry judges review every submission and advance " +
      "the top teams. Finalists present live at 3:45 PM, open to the public, " +
      "and the Cocoa Dolce leadership picks the winners.",
    blocks: [
      {
        kind: "list",
        label: "Preliminary panel",
        items: [
          "Grant Johnson — AI Software Engineering Leader, INVISTA. WSU alum.",
          "Dane Laughlin — Industries Lead, Squint. WSU alum.",
          "Two more local AI industry leaders, to be announced",
        ],
      },
      {
        kind: "list",
        label: "Finals panel",
        items: [
          "Ben Hesse — Chief Operating Officer, Cocoa Dolce",
          "Two more Cocoa Dolce leaders, to be announced",
        ],
      },
      {
        kind: "list",
        label: "The rubric — Build Track, each 1 to 5",
        items: [
          "Works: it runs, end to end, on the link you gave.",
          "Useful to Cocoa Dolce: they would actually put it to use.",
          "Understood the business: specific to how they run, not generic with a chocolate label.",
          "Honest about limits: documents where it breaks.",
        ],
      },
      {
        kind: "list",
        label: "The rubric — Pitch Track, each 1 to 5",
        items: [
          "Sound argument: the recommendation follows from the evidence.",
          "Verifiable evidence: sourced, checkable numbers.",
          "Understood the business: specific to how they run, not generic with a chocolate label.",
          "Tangible demo: the artifact makes the idea real.",
        ],
      },
      {
        kind: "text",
        label: "How the scores work",
        body:
          "Two judges per track score every submission in that track independently " +
          "on the rubric above. The average ranks the track and the top three " +
          "advance. Michael runs the day and breaks ties; he does not score. " +
          "The rubric is public so every team is scored on the same lines.",
      },
    ],
  },
  {
    id: "rules",
    nav: "Rules",
    title: "The rules.",
    blocks: [
      {
        kind: "list",
        label: "Teams",
        items: [
          "WSU students only. Any major, any level.",
          "Teams of one to five. Solo competes on the same terms.",
          "Teams lock at registration. No changes after, no forming on the day.",
          "You must be at the finale to compete. No remote entries.",
        ],
      },
      {
        kind: "list",
        label: "The work",
        items: [
          "Answer one prompt. One submission, one track, chosen when you submit.",
          "Start after the prompts unlock. A project you had already built is not an entry.",
          "Any tools, any stack. AI is optional.",
          "Your team’s own work. In the Pitch Track, cite your sources; an unsourced number is worth less than none.",
          "The prompts describe a real business. Treat the detail as theirs, and do not contact Cocoa Dolce staff or suppliers for your entry.",
        ],
      },
      {
        kind: "list",
        label: "Submitting — 1:00 to 2:15 PM on the 19th",
        items: [
          "A Microsoft Form. The link is posted here on the day.",
          "Team name, track, prompt, a link to your product or demo, a link to your video (three minutes maximum).",
          "Links must open without a login or an install. Test them in a private window first.",
          "Unlisted video is fine. Private is not.",
          "2:15 PM is a hard cutoff. Judging starts the moment the form closes.",
        ],
      },
      {
        kind: "text",
        label: "You keep what you build",
        body:
          "You own everything you make. Cocoa Dolce gets a non-exclusive licence " +
          "to use ideas presented to them, and the AI Club may feature your " +
          "project in photos and recaps. Nothing is taken from you.",
      },
    ],
  },
  {
    id: "faq",
    nav: "FAQ",
    title: "Questions.",
    blocks: [
      {
        kind: "list",
        label: "Answers",
        items: [
          "Can we switch tracks? Yes, right up to 2:15 PM on the 19th. You declare at submission.",
          "Can we answer two prompts? No. One prompt, one submission.",
          "Can we change our team? No. Teams lock at registration.",
          "Does the project have to use AI? No. Neither track requires it.",
          "Can we use code or research from before the prompts unlocked? Libraries, templates, and public tools, yes. A project you had already built, no.",
          "Do we have to be there all day? You must be there to submit and, if you advance, to present. Come for the whole thing.",
          "Something is unclear? aiclub@wichita.edu.",
        ],
      },
    ],
  },
];

export const CONTACT_EMAIL = "aiclub@wichita.edu";
