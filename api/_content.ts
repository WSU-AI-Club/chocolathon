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
  | { kind: "list"; label: string; items: string[] }
  /* Ordered, for instructions a reader follows in sequence. */
  | { kind: "steps"; label: string; items: string[] }
  /* Outbound links rendered as real anchors, never bare URLs. */
  | { kind: "links"; label: string; items: { text: string; href: string }[] }
  /* YouTube embeds by video id, privacy-enhanced domain. */
  | { kind: "videos"; label: string; items: { id: string; title: string }[] }
  /* Question and answer pairs; the question is set bold so a phone
     reader can find theirs without reading every line. */
  | { kind: "qa"; label: string; items: { q: string; a: string }[] }
  /* A warning the reader must not miss, set bold in a ruled box. Money
     and deadlines only. */
  | { kind: "alert"; label: string; body: string }
  /* A scoring rubric: criteria with what a 1, a 5, and a 10 look like.
     Rendered by RubricView on HQ and on the judge page. */
  | {
      kind: "rubric";
      label: string;
      items: { name: string; low: string; mid: string; high: string }[];
    };

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
    teaser: "Capture which chocolates go into every box sold at the counter, without slowing the sale.",
    blocks: [
      {
        kind: "text",
        label: "Problem",
        body:
          "At the chocolate bar in every Cocoa Dolce shop, the customer picks " +
          "their pieces and the cashier assembles the box by hand. Nobody " +
          "records which chocolates went in. The sale is logged; what was in " +
          "the box is not. That is missing data, and Cocoa Dolce has no record " +
          "of which pieces its customers actually choose.",
      },
      {
        kind: "text",
        label: "Challenge",
        body:
          "Build a fast, simple way to capture what goes into each box as it is " +
          "sold, so every assembled box leaves with a record of the chocolates " +
          "the customer chose. It has to fit a busy counter: a few seconds per " +
          "box, nothing extra asked of the customer, and no slower line. How you " +
          "capture it is up to you. It could be a tap-to-add screen, a scan, a " +
          "photo, voice, or something else. No training data is provided. If " +
          "you choose a camera, collecting your own examples is part of the " +
          "work, and a simple method that works beats a clever one that does " +
          "not. This is the hardest prompt on the board, and the one Cocoa " +
          "Dolce needs most.",
      },
      {
        kind: "list",
        label: "Winning entry includes",
        items: [
          "A working capture flow, demoed on a realistic box from the first piece to the saved record",
          "How many seconds it adds per box at the counter, measured rather than guessed",
          "One record per box (which pieces, how many) that the shop can export as CSV or JSON",
          "Honest notes on where it breaks: a rush at the counter, a mis-tap, look-alike pieces, a large box",
        ],
      },
      {
        kind: "text",
        label: "Stretch goal",
        body:
          "A simple view across many boxes: the most-picked pieces and the " +
          "combinations customers keep coming back to.",
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
  { time: "8:30 AM", what: "Doors open and check-in starts. Coffee, pastries, Cocoa Dolce chocolates." },
  { time: "9:15 AM", what: "Opening ceremony" },
  { time: "9:30 AM", what: "Networking. Teams work and refine." },
  {
    time: "10:00 AM",
    what: "Session 1: AI in Manufacturing: Databricks at Capital III",
    who: "Cody Herrin, Continuous Improvement and Innovation Manager, Capital III",
  },
  {
    time: "11:30 AM",
    what: "Session 2: Open Source, Open Weights, Open Questions",
    who: "Fareeha Amber Ansari, AI Governance Lead, Cargill",
  },
  { time: "12:30 PM", what: "Lunch, by Jimmy John’s" },
  { time: "1:00 PM", what: "Submissions open", flag: true },
  { time: "2:00 PM", what: "Submissions close. Hard cutoff.", flag: true },
  {
    time: "2:30 PM",
    what: "Session 3: Orchestrating AI, during preliminary judging",
    who: "Ramsey Jamoul, Founder and CEO, Unified",
  },
  { time: "3:45 PM", what: "Final presentations, to 4:30. Open to the public.", flag: true },
  { time: "4:45 PM", what: "Winners announced" },
  { time: "5:00 PM", what: "Pictures and wrap" },
];


/* ═══════════════════════════════════════════════════════════════════
   THE PEOPLE — speakers and judges, one list for the whole site.

   /people renders this directly (HQ's Judges section was replaced by a
   People button on 2026-09-13). Add or change a person here and the
   page follows. Judges still to be confirmed are the two
   "...Note" lines, never placeholder names.
   ═══════════════════════════════════════════════════════════════════ */

export type Person = {
  name: string;
  role: string; // title and organisation, as they want it printed
  note?: string; // one short line, optional
  linkedin?: string; // profile URL, supplied by the person or verified by Michael
  session?: { time: string; title: string }; // speakers only
};

export type People = {
  speakers: Person[];
  preliminary: Person[];
  preliminaryNote?: string;
  finals: Person[];
  finalsNote?: string;
};

export const PEOPLE: People = {
  speakers: [
    {
      name: "Cody Herrin",
      role: "Continuous Improvement and Innovation Manager, Capital III",
      linkedin: "https://www.linkedin.com/in/codyherrin/",
      session: { time: "10:00 AM", title: "AI in Manufacturing: Databricks at Capital III" },
    },
    {
      name: "Fareeha Amber Ansari",
      role: "AI Governance Lead, Cargill",
      linkedin: "https://www.linkedin.com/in/ansarifa/",
      session: { time: "11:30 AM", title: "Open Source, Open Weights, Open Questions" },
    },
    {
      name: "Ramsey Jamoul",
      role: "Founder and CEO, Unified",
      linkedin: "https://www.linkedin.com/in/ramsey-jamoul-423682b8/",
      note: "Unified runs the National AI Prompt Championship.",
      session: { time: "2:30 PM", title: "Orchestrating AI" },
    },
  ],
  preliminary: [
    {
      name: "Grant Johnson",
      role: "Creator of Chatterbox: Language Learning",
      linkedin: "https://www.linkedin.com/in/grant-johnson15/",
    },
    {
      name: "Dane Laughlin",
      role: "Industries Lead, Squint",
      note: "WSU alum.",
      linkedin: "https://www.linkedin.com/in/danelaughlin/",
    },
    {
      name: "Alexis Diaz",
      role: "Software Engineer, Koch Ag & Energy Solutions",
      note: "WSU computer science alum.",
      linkedin: "https://www.linkedin.com/in/alexis-diaz-wsu/",
    },
    {
      name: "Fareeha Amber Ansari",
      role: "AI Governance Lead, Cargill",
      note: "Also speaking at 11:30.",
      linkedin: "https://www.linkedin.com/in/ansarifa/",
    },
    {
      name: "Jeremy Simon",
      role: "Web & IT Manager, McCurdy Real Estate & Auction",
    },
  ],
  finals: [
    {
      name: "Ben Hesse",
      role: "Chief Operating Officer, Cocoa Dolce",
      note: "Judging with his leadership team.",
      linkedin: "https://www.linkedin.com/in/benjamin-hesse-420a551b/",
    },
  ],
};

/* Every section is a budget: one intro line and the fewest bullets that
   answer the question. Anything genuinely undecided is marked "to be
   announced" rather than invented. */
export const SECTIONS: Section[] = [
  {
    id: "tracks",
    nav: "Tracks",
    title: "Build or Pitch.",
    intro:
      "Four prompts on each side, and they are different problems. Build asks " +
      "for something that works; Pitch asks for a decision. Pick one prompt, " +
      "one track.",
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
          "$1,200 in scholarships: $700 to the Build Track winner and $500 to the " +
          "Pitch Track winner. Build pays more because it is the heavier lift. The " +
          "top two teams in each track each take home a big box of Cocoa Dolce " +
          "chocolates. AI is optional in both tracks; every team gets Lovable " +
          "credits because Lovable sponsors the event.",
      },
    ],
  },
  {
    id: "lovable",
    nav: "Lovable",
    title: "Your Lovable credits.",
    intro:
      "Lovable sponsors the event and gives every competitor a month of Pro " +
      "Plan 1 at no cost. Neither track requires it; it is the fastest way to " +
      "have something working by Saturday.",
    blocks: [
      {
        kind: "list",
        label: "How it works",
        items: [
          "The code gives you Pro Plan 1 (100 credits) at no cost, with every Pro Plan 1 feature for the length of the plan.",
          "We email the discount code to every registered competitor. It is not posted on this site.",
          "Redeem it before the event ends: 5:00 PM, Saturday, September 19.",
          "The code is for Chocolathon competitors only. Do not share it with anyone outside the event.",
        ],
      },
      {
        kind: "steps",
        label: "Redeeming your code",
        items: [
          "Go to lovable.dev.",
          "No account yet? Click Get started and create one. Already have one? Go to Settings, then Plans & Credits. If that account is already on a paid plan, create a new workspace and redeem the code there.",
          "Select Pro Plan 1 (100 credits), and make sure you choose the monthly plan.",
          "At checkout, enter the discount code from our email.",
        ],
      },
      {
        kind: "alert",
        label: "Then cancel, right away",
        body:
          "Cancel your plan as soon as it is activated. You keep Pro Plan 1 and " +
          "your 100 credits for the full month; cancelling only stops the charge " +
          "for next month. Checkout may ask for payment details, which is why " +
          "this step matters.",
      },
      {
        kind: "videos",
        label: "Two short videos",
        items: [
          { id: "W92iTgxWyts", title: "Intro to Lovable" },
          { id: "4NpUPggv3oU", title: "Ideas are everywhere" },
        ],
      },
      {
        kind: "links",
        label: "Learn it fast",
        items: [
          { text: "Lovable Academy", href: "https://academy.lovable.app/academy" },
          { text: "Docs: welcome", href: "https://docs.lovable.dev/introduction/welcome" },
          { text: "Docs: prompting", href: "https://docs.lovable.dev/prompting/prompting-one" },
          { text: "Templates to start from", href: "https://lovable.dev/templates" },
          { text: "Docs: collaboration, for working as a team", href: "https://docs.lovable.dev/features/collaboration" },
        ],
      },
    ],
  },
  {
    id: "schedule",
    nav: "Schedule",
    title: "Saturday, September 19.",
    intro: "Woolsey Hall, WSU. Doors and check-in open at 8:30 AM, wrap at 5:00 PM, food all day.",
    blocks: [
      {
        kind: "text",
        label: "Backed by the Barton School",
        body:
          "The room at Woolsey Hall is supported by the Office of Career and " +
          "Professional Development. The three sessions are open to the public. " +
          "Timing may shift by a few minutes.",
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
          "Hardware is welcome in the Build Track. Preliminary judges score from your links and never handle a device, so your product link must prove it works on its own. Finalists demo live on stage.",
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
    id: "rubric",
    nav: "Rubric",
    title: "How you are scored.",
    intro:
      "Two rounds. Local AI industry judges score every submission on these " +
      "lines, with no weights and no secrets; the top three per track advance. " +
      "The finals are not scored: Cocoa Dolce picks the winners from the live " +
      "finals at 3:45 PM, open to the public.",
    blocks: [
      {
        kind: "rubric",
        label: "Build Track",
        items: [
          {
            name: "It runs.",
            low: "Nothing to click.",
            mid: "The main path runs, parts stubbed.",
            high: "End to end, on your link.",
          },
          {
            name: "They could operate it.",
            low: "Needs you standing next to it.",
            mid: "Works with a walkthrough.",
            high: "Staff could use it Monday.",
          },
          {
            name: "It answers the prompt.",
            low: "Generic, with a chocolate label.",
            mid: "Solves the task, with gaps.",
            high: "Built for how they actually work.",
          },
          {
            name: "Honest about limits.",
            low: "Claims more than it does.",
            mid: "Some limits named.",
            high: "Says where it breaks, and the fix.",
          },
        ],
      },
      {
        kind: "rubric",
        label: "Pitch Track",
        items: [
          {
            name: "The recommendation is specific.",
            low: "A theme.",
            mid: "A direction.",
            high: "What to do, by when, at what cost.",
          },
          {
            name: "The evidence holds up.",
            low: "Unsourced numbers.",
            mid: "Sourced, but thin.",
            high: "Sourced, checkable, right.",
          },
          {
            name: "The payoff is sized.",
            low: "No number.",
            mid: "A number with no basis.",
            high: "What it is worth, and how you got there.",
          },
          {
            name: "The artifact makes it real.",
            low: "Slides only.",
            mid: "A mock-up of the idea.",
            high: "Something they could react to as real.",
          },
        ],
      },
      {
        kind: "list",
        label: "Before scoring: four gates",
        items: [
          "The link opens without a login or an install.",
          "The video is three minutes or under.",
          "One submission per team, by one person, in one track.",
          "The work started after the prompts unlocked.",
          "An entry that fails a gate is not scored, and the team is told which gate.",
        ],
      },
      {
        kind: "steps",
        label: "How teams advance",
        items: [
          "Each judge scores every entry in their track alone: 1 to 10 on each of the four lines, plus one comment.",
          "A team's score is the average of its judges' totals. A judge who knows a team does not score it.",
          "The top three teams in each track go to the finals. Scores do not carry forward; finalists start level.",
          "AI Club leadership runs the day and does not score. After the event, any team can ask for its own scores and comments.",
        ],
      },
      {
        kind: "steps",
        label: "If two teams tie",
        items: [
          "The higher total on the first line of their rubric.",
          "Then the higher total on the second line.",
          "Then the higher median judge total.",
          "Still tied: AI Club leadership talks it through with the judges and decides how to proceed.",
        ],
      },
      {
        kind: "text",
        label: "The finals are not scored",
        body:
          "Finalists present live at 3:45. Ben Hesse and his Cocoa Dolce " +
          "leadership team pick one winner in each track — the product they " +
          "would use, or the recommendation they would act on. No rubric, no " +
          "scores: it is their business and their call.",
      },
    ],
  },
  {
    id: "submissions",
    nav: "Submissions",
    title: "Submitting.",
    intro:
      "Saturday, September 19, 1:00 to 2:00 PM, through a Microsoft Form. The button " +
      "below unlocks at 1:00. Have everything on this list ready before then.",
    blocks: [
      {
        kind: "list",
        label: "What the form asks for",
        items: [
          "Your team name, exactly as you registered it",
          "The submitter’s name and WSU email",
          "Your track, and which prompt you answered",
          "One sentence: what you built, or what you are recommending",
          "A link to your product, demo, or presentation",
          "A link to your video, three minutes maximum",
          "What a judge should click first",
          "A repository or source link, if you have one",
          "Anything the judges need to run it: a test login, a sample zip code, a demo account",
        ],
      },
      {
        kind: "list",
        label: "Make it judgeable",
        items: [
          "Links must open without a login or an install. Test them in a private window first.",
          "Unlisted video is fine. Private is not.",
          "One submission per team, by one person.",
          "2:00 PM is a hard cutoff. Judging starts the moment the form closes.",
          "Building hardware? Your product link is a page that proves it: an unedited video of the device doing the real task, photos, and the software side if there is one. Bring the device on the 19th.",
        ],
      },
    ],
  },
  {
    id: "faq",
    nav: "FAQ",
    title: "Questions.",
    blocks: [
      {
        kind: "qa",
        label: "Answers",
        items: [
          { q: "Can we switch tracks?", a: "Yes, right up to 2:00 PM on the 19th. You declare at submission." },
          { q: "Can we answer two prompts?", a: "No. One prompt, one submission." },
          { q: "Can we change our team?", a: "No. Teams lock at registration." },
          { q: "Does the project have to use AI?", a: "No. Neither track requires it." },
          { q: "Can we build a physical hardware product?", a: "Yes, in the Build Track. Preliminary judges score from your links and never handle the device, so your product link must be a page that proves it works: an unedited video of it doing the real task, photos, and the software side if there is one. Bring it on the 19th; finalists demo live on stage." },
          { q: "Can we use code or research from before the prompts unlocked?", a: "Libraries, templates, and public tools, yes. A project you had already built, no." },
          { q: "Do we have to be there all day?", a: "You must be there to submit and, if you advance, to present. Come for the whole thing." },
          { q: "Something is unclear?", a: "aiclub@wichita.edu." },
        ],
      },
    ],
  },
];

/* ── Results ──────────────────────────────────────────────────────────
   Prepared before the event, published after it by flipping ONE switch:
   set `published: true` below, fill in the names, push. The HQ page then
   opens on Results (above the prompts) and the landing page's HQ band
   gains a Results row; nothing else changes. Empty strings render as
   nothing, so a half-filled entry never shows a blank line. */

export type ResultEntry = {
  team: string;
  prompt: string; // e.g. "B-2"
  line: string; // one sentence on what they built or pitched
  demo?: string;
  video?: string;
};

export type TrackResult = {
  track: "build" | "pitch";
  winner: ResultEntry;
  second: ResultEntry;
  finalists: string[]; // the other finalist team names
};

export type Results = {
  published: boolean;
  intro: string;
  tracks: TrackResult[];
};

export const RESULTS: Results = {
  published: false,
  intro:
    "Twenty-odd teams, eight prompts, one Saturday at Woolsey Hall. Here is who " +
    "the Cocoa Dolce leadership picked, and what they built.",
  tracks: [
    {
      track: "build",
      winner: { team: "", prompt: "", line: "", demo: "", video: "" },
      second: { team: "", prompt: "", line: "", demo: "", video: "" },
      finalists: [],
    },
    {
      track: "pitch",
      winner: { team: "", prompt: "", line: "", demo: "", video: "" },
      second: { team: "", prompt: "", line: "", demo: "", video: "" },
      finalists: [],
    },
  ],
};

export const CONTACT_EMAIL = "aiclub@wichita.edu";
