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

/* No registration dates here on purpose: registration is handled off
   this page, and this page must never contradict what the club announces
   about it. */
export const KEY_DATES: { date: string; what: string; done?: boolean }[] = [
  { date: "Mon Sep 14", what: "Prompts release here, at midnight. Build starts." },
  { date: "Sat Sep 19", what: "The finale — Woolsey Hall, 8:30 AM to 5:00 PM" },
];

export const RUN_OF_DAY: { time: string; what: string; flag?: boolean }[] = [
  { time: "8:30 AM", what: "Doors open. Coffee, pastries, and Cocoa Dolce chocolates" },
  { time: "9:15 AM", what: "Opening ceremony" },
  { time: "9:30 AM", what: "Teams work and refine" },
  {
    time: "11:30 AM",
    what:
      "Session 1: Open Source, Open Weights, Open Questions — Fareeha Amber Ansari, AI Governance Lead, Cargill",
  },
  { time: "12:15 PM", what: "Lunch (Jimmy John’s)" },
  { time: "1:00 PM", what: "Submissions OPEN", flag: true },
  { time: "2:15 PM", what: "Submissions CLOSE — hard cutoff", flag: true },
  { time: "2:30 PM", what: "Session 2 (speaker TBA), during preliminary judging" },
  { time: "3:45 PM", what: "Final presentations — open to the public" },
  { time: "4:45 PM", what: "Winners announced" },
  { time: "5:00 PM", what: "Pictures and wrap" },
];

export const SECTIONS: Section[] = [
  {
    id: "start",
    nav: "Start here",
    title: "How this works",
    intro:
      "Everything you need to compete is on this page: the eight prompts, the " +
      "rules, how you submit, and how you get judged. Read this section once " +
      "and you will not be surprised on the 19th.",
    blocks: [
      {
        kind: "list",
        label: "The short version",
        items: [
          "Eight prompts, four per track. Pick ONE and answer it.",
          "You do not declare a track now — you choose Build or Pitch when you submit on the 19th.",
          "Build ahead. The days between September 14 and 19 are the competition; the 19th is the finale.",
          "Show up Saturday September 19 at Woolsey Hall. Submit between 1:00 and 2:15 PM.",
          "Top teams present live at 3:45 PM. Winners at 4:45 PM.",
        ],
      },
      {
        kind: "text",
        label: "Why building ahead is not optional",
        body:
          "Finale day gives you roughly three working hours before submissions " +
          "close, and two of them have a session and lunch in them. A team that " +
          "starts on Saturday morning is submitting a sketch. Treat September 14 " +
          "as the start line, not the 19th.",
      },
      {
        kind: "text",
        label: "You keep what you build",
        body:
          "You own everything you make. Cocoa Dolce gets a non-exclusive licence " +
          "to use ideas presented to them, and the WSU AI Club may feature your " +
          "project in event photos, recaps, and promotion. Non-exclusive means " +
          "nothing is taken from you — you keep using, showing, and building on " +
          "your own work. This is the same clause you ticked at registration.",
      },
    ],
  },
  {
    id: "tracks",
    nav: "The two tracks",
    title: "Build or Pitch",
    intro:
      "Both tracks answer the same kind of problem. They differ in HOW you answer, " +
      "and they are judged separately — a product is never scored against a " +
      "recommendation.",
    blocks: [
      {
        kind: "list",
        label: "Build Track — ship something that works",
        items: [
          "Answer by building: a working product or prototype Cocoa Dolce could put to use",
          "You submit the product, a video, and a demo",
          "Judged on how genuinely useful and how well built it is",
          "$700 scholarship to the winning team, with a big box of Cocoa Dolce chocolates",
        ],
      },
      {
        kind: "list",
        label: "Pitch Track — pitch something they should do",
        items: [
          "Answer by making the case: a recommendation Cocoa Dolce could act on, backed by real evidence",
          "You submit a pitch video and a demo that makes the idea tangible — a mock landing page, a concept prototype, a data visualization",
          "Judged on the strength of the argument and the evidence behind it",
          "$500 scholarship to the winning team, with a big box of Cocoa Dolce chocolates",
        ],
      },
      {
        kind: "text",
        label: "Why the prizes are unequal",
        body:
          "Build pays more because it is the heavier lift. That is a deliberate " +
          "weighting, not a statement about which work matters. One scholarship per " +
          "track: the winning team takes the scholarship and a big box of Cocoa Dolce " +
          "chocolates, and second place in each track takes home the same box. " +
          "Both tracks are judged on their own terms.",
      },
      {
        kind: "text",
        label: "The Pitch demo is not an AI requirement",
        body:
          "Pitch teams build a demo so you have something to show on stage rather " +
          "than slides alone. Build it with anything — Lovable, a spreadsheet, " +
          "Figma, code, paper. Every participant gets Lovable credits because " +
          "Lovable sponsors the event, not because the tools are mandatory. No " +
          "prompt on this page requires AI to answer.",
        },
    ],
  },
  {
    id: "rules",
    nav: "Rules",
    title: "The rules",
    blocks: [
      {
        kind: "list",
        label: "Eligibility and teams",
        items: [
          "WSU students only — undergraduate, graduate, and doctoral. Any major.",
          "Teams of one to four. Solo is allowed and competes on the same terms.",
          "Teams lock at registration. No adding, swapping, or merging members after that, and no team formation on event day.",
          "You must attend the finale on September 19 to compete. No remote submissions.",
        ],
      },
      {
        kind: "list",
        label: "The work",
        items: [
          "Answer ONE prompt. Do not submit against two.",
          "Choose your track when you submit, not before.",
          "Start after the prompts release on September 14. Work you had already built before then is not an entry.",
          "Any tools, any stack, any sources. AI is optional in both tracks.",
          "Everything you submit must be your team’s own work. Use of AI tools is expected and fine; passing off someone else’s project as yours is not.",
          "Cite your sources in the Pitch Track. “Verifiable” is in the judging criteria for a reason — an unsourced number is worth less than no number.",
        ],
      },
      {
        kind: "list",
        label: "What Cocoa Dolce shares with you",
        items: [
          "These prompts describe how a real local business actually runs. Treat the operational detail in them as theirs, not yours to publish.",
          "The finals at 3:45 PM are open to the public, so assume anything you put in a submission or say on stage will be heard publicly.",
          "Do not contact Cocoa Dolce staff, stores, or suppliers for information as part of your entry. Their public site and anything in these prompts is fair game; their people are working.",
        ],
      },
    ],
  },
  {
    id: "submitting",
    nav: "Submitting",
    title: "How you submit",
    intro:
      "Submissions happen on finale day only, through a Microsoft Form, between " +
      "1:00 and 2:15 PM. The window is short and the cutoff is hard — have your " +
      "links ready before 1:00.",
    blocks: [
      {
        kind: "list",
        label: "What the form asks for",
        items: [
          "Your team name, exactly as registered",
          "Your track — Build or Pitch. This is where you choose.",
          "Which prompt you answered (e.g., B-2 or P-3)",
          "A link to your product or demo — must open without a login and without an install",
          "A link to your video",
        ],
      },
      {
        kind: "list",
        label: "Make your links judgeable",
        items: [
          "Test your link in a private/incognito window before you submit. A judge who hits a login screen scores what they can see, which is nothing.",
          "Deployed URL beats a repo. If you must send a repo, put a working link at the top of the README.",
          "Unlisted video hosting is fine — private is not.",
          "Video length, format, and the submission form URL are TBA and will be posted here before the 19th.",
        ],
      },
      {
        kind: "text",
        label: "Late is late",
        body:
          "Preliminary judging starts the moment the form closes at 2:15 PM so " +
          "that finalists can be on stage at 3:45. There is no grace period built " +
          "into that schedule.",
      },
    ],
  },
  {
    id: "judging",
    nav: "Judging",
    title: "How you get judged",
    blocks: [
      {
        kind: "text",
        label: "Two rounds",
        body:
          "First, a panel of local AI and industry judges reviews every submission " +
          "through the form and advances the top teams. Those finalists then present " +
          "live on stage at 3:45 PM, where the Cocoa Dolce leadership team helps " +
          "decide the winners.",
      },
      {
        kind: "list",
        label: "What moves the needle",
        items: [
          "Build: does it work, and is it genuinely useful to Cocoa Dolce? Judging is weighted toward real usefulness over polish.",
          "Pitch: is the argument sound, and is the evidence behind it real and verifiable?",
          "Both: did you understand THEIR business? A generic solution with a chocolate label scores badly in either track.",
          "Honesty about limits is scored as a strength, not a weakness — especially on B-1.",
        ],
      },
      {
        kind: "list",
        label: "The panels",
        items: [
          "Preliminary: Grant Johnson, AI Software Engineering Leader, INVISTA (Koch Industries), WSU alum · Dane Laughlin, Industries Lead, Squint, WSU alum · two more TBA",
          "Final: Ben Hesse, COO, Cocoa Dolce · two more Cocoa Dolce leaders TBA",
          "Michael runs the day and breaks ties; he does not score.",
        ],
      },
    ],
  },
  {
    id: "day",
    nav: "Finale day",
    title: "Saturday, September 19",
    intro:
      "Woolsey Hall, WSU. Doors at 8:30 AM, wrap at 5:00 PM. Food is provided all " +
      "day. Minor timing changes are possible; this page is the version of record.",
    blocks: [
      {
        kind: "list",
        label: "Bring",
        items: [
          "Your laptop and charger",
          "Your project already deployed and your links already tested",
          "Your student ID",
        ],
      },
      {
        kind: "text",
        label: "Lovable credits",
        body:
          "Every participant gets Lovable build credits, handed out in person on " +
          "the day. They are a sponsor benefit, not a requirement — nothing on " +
          "this page has to be built with them.",
      },
    ],
  },
  {
    id: "faq",
    nav: "FAQ",
    title: "Questions we expect",
    blocks: [
      {
        kind: "list",
        label: "Answers",
        items: [
          "Can we switch tracks? Yes — you declare your track at submission, so you can change your mind right up to 2:15 PM on the 19th.",
          "Can we answer two prompts? No. One prompt, one submission, one track.",
          "Can we change our team? No. Teams lock at registration.",
          "Does our project have to use AI? No. Neither track requires it.",
          "Can we use code or research we wrote before September 14? Libraries, templates, and public tools yes. A project you had already built, no.",
          "Do we have to be there all day? You must be there to submit and, if you advance, to present. Come for the whole thing — the sessions and the food are part of it.",
          "What if only one of us can make it? A team can be represented by whoever can attend, but the team roster does not change.",
          "Something is wrong or unclear — who do we ask? aiclub@wichita.edu.",
        ],
      },
    ],
  },
];

export const CONTACT_EMAIL = "aiclub@wichita.edu";
