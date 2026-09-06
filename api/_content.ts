/* ═══════════════════════════════════════════════════════════════════
   COMPETITOR CONTENT — SERVER ONLY. NEVER IMPORT THIS FROM src/.

   This file is compiled into the Vercel serverless functions, not into
   the browser bundle. That is the whole point: the challenge prompts do
   not exist anywhere a logged-out visitor can reach them, including
   View Source and the network tab. Import it from `src/` even once and
   the secrecy is gone.

   Two gates protect the prompts:
     1. a valid competitor code (see `_session.ts`)
     2. the release clock — PROMPTS_RELEASE_AT, default Sep 14 midnight CT

   Gate 2 means a code that leaks early still cannot surface the prompts,
   and nobody has to be at a keyboard on the 14th to publish them.
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
        label: "The problem on the floor",
        body:
          "“How do we know every single chocolate that’s put in a box? " +
          "We don’t have that data.” Every truffle is a uniform shape, " +
          "hand-painted in cocoa-butter color patterns — splatters, swirls, " +
          "splashes. No two are identical, but each variety shares a defined " +
          "color palette.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Build a proof-of-concept that identifies truffle varieties from a " +
          "photo and logs what’s in a box. You do not need production-grade " +
          "accuracy across every variety — you need to prove the idea works " +
          "on a real, limited set. Start with color-palette matching (e.g., " +
          "“70% of one color, 30% of another”) on a handful of varieties " +
          "under good lighting. Getting three or four varieties classified " +
          "reliably is a win; the honesty about where it breaks is part of the " +
          "score.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A working demo that classifies at least a few truffle varieties from photos, with stated accuracy",
          "A simple capture workflow a packer could realistically follow (phone or fixed camera)",
          "Structured output (JSON or CSV per box) that could feed Odoo inventory",
          "Honest documentation of where accuracy holds and where it falls apart — lighting, similar palettes, pattern overlap",
        ],
      },
      {
        kind: "text",
        label: "Stretch goal",
        body:
          "Push past color into pattern recognition, or flag boxes that deviate " +
          "from the expected assortment before they ship.",
      },
      {
        kind: "text",
        label: "A note on scope",
        body:
          "This is the hardest prompt on the board and the most research-flavored. " +
          "A small, honest, working proof-of-concept beats an over-promised demo " +
          "that only works on three cherry-picked photos. Modern AI tools make a " +
          "basic image classifier more reachable than it used to be — lean on " +
          "them, and tell us what you learned.",
      },
    ],
  },
  {
    id: "B-2",
    track: "build",
    title: "Thermal Shipping Decision Engine",
    teaser:
      "Automate the daily call: no thermal, single thermal, or double with extra ice.",
    blocks: [
      {
        kind: "text",
        label: "The problem on the floor",
        body:
          "Every day the shipping team pulls order forms, eyeballs the zip code, " +
          "checks whether it’s above 75°F in Wichita or the receiving state, " +
          "and decides: no thermal, single thermal, or double thermal with extra " +
          "ice packs. It works — but it’s manual, and one wrong call means " +
          "melted product.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Automate the triage. Build a tool that ingests destination zip codes, " +
          "pulls origin and destination forecasts for the transit window, applies " +
          "the thermal thresholds, and outputs a daily pack list with the " +
          "packaging decision per order.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A working tool that takes a batch of zip codes (or a Shopify order export) and returns thermal decisions",
          "Configurable temperature thresholds so the team can tune the rules",
          "A clear daily summary view the packing team can print or pull up on a tablet",
          "Handling for multi-day transit (worst-case temperature along the window, not just day of shipment)",
        ],
      },
      {
        kind: "text",
        label: "Stretch goal",
        body:
          "Estimate ice-pack and thermal-liner cost per day so the business can " +
          "see the spend.",
      },
    ],
  },
  {
    id: "B-3",
    track: "build",
    title: "Design-Your-Box — Visual Corporate Order Builder",
    teaser:
      "Give corporate clients the visual box builder that only consumers get today.",
    blocks: [
      {
        kind: "text",
        label: "The problem on the floor",
        body:
          "Direct-to-consumer customers get a visual box builder online. Corporate " +
          "clients — the customers placing 75,000-piece orders — get a PDF " +
          "and a long concierge email thread to specify where their logo chocolates " +
          "and accents go.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Build a web-based visual box configurator for corporate orders: pick a " +
          "box size, drag chocolates (including logo pieces) into position, choose " +
          "ribbon/card/band options, and output both a client-facing preview and a " +
          "production spec.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A working drag-and-drop box builder with at least two box sizes",
          "Placement rules (e.g., logo pieces front-center) that the tool enforces or suggests",
          "A shareable visual proof the concierge team can send for approval",
          "A machine-readable spec export for production",
        ],
      },
      {
        kind: "text",
        label: "Stretch goal",
        body:
          "Brand-color matching: upload a logo and get suggested chocolate color " +
          "palettes.",
      },
    ],
  },
  {
    id: "B-4",
    track: "build",
    wildcard: true,
    title: "Wildcard — Build Something They Don’t Know They Need",
    teaser: "You saw something we didn’t. This lane is for you.",
    blocks: [
      {
        kind: "text",
        label: "The opening",
        body:
          "The challenges above came from one afternoon on Cocoa Dolce’s floor. " +
          "You saw something we didn’t, or you have an idea none of these " +
          "capture. This lane is for you.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Build a working tool that solves a real Cocoa Dolce problem or opens a " +
          "real opportunity — anything grounded in how their business actually " +
          "runs (production, packaging, shipping, ordering, retail, or the customer " +
          "experience). It must be something Cocoa Dolce could imagine using, not a " +
          "general-purpose app that happens to mention chocolate.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A working build (Lovable or your own stack), demoable on Saturday",
          "A clear, one-sentence answer to “what Cocoa Dolce problem does this solve?”",
          "Evidence you understood their business, not a generic solution with a chocolate label",
          "The same bar as every other Build entry: does it work, and is it genuinely useful to them?",
        ],
      },
      {
        kind: "text",
        label: "The one rule",
        body:
          "If a judge can’t tell why Cocoa Dolce specifically would want this, it " +
          "belongs in a different hackathon. Ground it in their floor.",
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
    teaser:
      "Hundreds of molds, hand-polished, half a day, every cycle. Cost it and fix it.",
    blocks: [
      {
        kind: "text",
        label: "The problem on the floor",
        body:
          "Polycarbonate molds lose their shine after two to three runs. Today’s " +
          "fix is manual: alcohol wipe, rinse, wash, then hand-polishing — " +
          "hundreds of molds, a whole team, half a day, every cycle. That’s labor " +
          "and capacity Cocoa Dolce loses during the exact season they can least " +
          "afford it.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Don’t just find a cleaner mold process — build the business case " +
          "for changing it. Research real options (machine agitators, ultrasonic or " +
          "chemical baths, what other chocolatiers actually do, material-science " +
          "limits on polycarbonate), then make a recommendation Cocoa Dolce could act " +
          "on, with the labor and capacity math behind it. Frame it as: here’s what " +
          "this manual process costs you, here’s the fix, here’s the payback.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A recommendation backed by real, sourced options (vendors, models, rough costs — all verifiable)",
          "The cost of the status quo in labor-hours and lost capacity, especially in peak season",
          "A payback and risk read: mold lifespan, food safety, finish quality",
          "A pilot Cocoa Dolce could run within one quarter",
        ],
      },
      {
        kind: "text",
        label: "How Lovable helps",
        body:
          "Make the case land with something interactive, not a static memo: a " +
          "payback calculator where a judge adjusts labor hours and equipment cost " +
          "and watches the break-even move, or a clean visual one-pager of the " +
          "current-vs-proposed process. Every team gets Lovable credits — this is " +
          "what turns a research memo into a pitch.",
      },
    ],
  },
  {
    id: "P-2",
    track: "pitch",
    title: "Own the Off-Peak — Revenue Beyond the Holidays",
    teaser: "Summer is the lightest season. Pitch the concept that fills it.",
    blocks: [
      {
        kind: "text",
        label: "The problem on the floor",
        body:
          "Summer is the lightest season, and leadership’s stated goal is to build " +
          "the off-peak business so growth doesn’t depend on stacking more volume " +
          "into an already-bottlenecked December. The turn-down chocolate program for " +
          "a major hotel property (a 75,000–100,000 piece order) showed what a " +
          "single B2B concept can unlock.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Pitch a revenue-driving concept for the off-peak months: a seasonal event, " +
          "a brand activation, a subscription, a new B2B product line, an experience. " +
          "Think like a brand builder, not just a marketer.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A fully developed concept: audience, positioning, pricing, revenue model",
          "An operating plan that fits their slow-season production capacity",
          "Financial projections with stated, defensible assumptions",
          "A launch timeline and marketing plan they could run with their current team",
        ],
      },
      {
        kind: "text",
        label: "How Lovable helps",
        body:
          "Make the concept real enough to sell from the stage. Build the thing your " +
          "pitch is about: the mock landing page for the summer subscription, the " +
          "booking page for the event, the B2B microsite for the new product line. A " +
          "judge who can click through your idea believes it more than one who only " +
          "hears it described. Every team gets Lovable credits — this is exactly " +
          "what it’s built for.",
      },
    ],
  },
  {
    id: "P-3",
    track: "pitch",
    title: "The Cocoa Price Squeeze",
    teaser:
      "Cocoa tripled in two years. They made the piece bigger. Now what?",
    blocks: [
      {
        kind: "text",
        label: "The problem on the floor",
        body:
          "Cocoa prices have roughly tripled in two years. Many chocolatiers are " +
          "shrinking pieces or straying from real chocolate. Cocoa Dolce went the " +
          "other way — it made the piece bigger — and quality is the brand.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Build the business case for how a premium chocolatier should navigate " +
          "sustained cocoa inflation: pricing, product mix, sourcing, and hedging " +
          "— without eroding the brand promise.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A verifiable market analysis of cocoa pricing and forward outlook",
          "A pricing and product-mix strategy with margin modeling",
          "An evaluation of sourcing and hedging levers realistic for a company this size",
          "Clear guidance on what NOT to do — the moves that would damage the brand",
        ],
      },
      {
        kind: "text",
        label: "How Lovable helps",
        body:
          "Turn your margin model into something the leadership team can play with: a " +
          "Lovable pricing calculator where they adjust cocoa cost, piece size, and " +
          "price, and watch margin and brand-positioning move together. A living model " +
          "they can test their own scenarios in is far more persuasive than a static " +
          "spreadsheet screenshot. Every team gets Lovable credits — use them to " +
          "make your strategy interactive.",
      },
    ],
  },
  {
    id: "P-4",
    track: "pitch",
    wildcard: true,
    title: "Wildcard — Pitch the Move They Haven’t Made",
    teaser: "You see a bigger opportunity. This lane is for you.",
    blocks: [
      {
        kind: "text",
        label: "The opening",
        body:
          "The prompts above came from one afternoon on Cocoa Dolce’s floor. You " +
          "see a bigger opportunity, a risk they should get ahead of, or a strategic " +
          "question none of these capture. This lane is for you.",
      },
      {
        kind: "text",
        label: "The challenge",
        body:
          "Build the business case for a strategic move Cocoa Dolce could actually " +
          "make — a market to enter, a channel to open, a partnership, a pricing " +
          "or positioning shift, an operational bet. Anything grounded in how their " +
          "business actually runs and where it could go. It must be a decision Cocoa " +
          "Dolce could imagine putting real money behind, not a generic strategy deck " +
          "that happens to mention chocolate.",
      },
      {
        kind: "list",
        label: "What a winning entry looks like",
        items: [
          "A clear, one-sentence answer to “what should Cocoa Dolce do, and why now?”",
          "A recommendation backed by real, sourced evidence — market data, costs, comparables, all verifiable",
          "The math behind it: what it costs, what it returns, what the risk is",
          "Evidence you understood their business, not a generic strategy with a chocolate label",
        ],
      },
      {
        kind: "text",
        label: "The one rule",
        body:
          "If a judge can’t tell why Cocoa Dolce specifically would act on this, it " +
          "belongs in a different hackathon. Ground it in their floor.",
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

export const KEY_DATES: { date: string; what: string; done?: boolean }[] = [
  { date: "Mon Aug 24", what: "Registration opens" },
  { date: "Thu Sep 10", what: "Registration closes — teams lock, no late entries" },
  { date: "Mon Sep 14", what: "Prompts release here. Build starts." },
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
      "You are registered. Everything you need to compete is on this page, and " +
      "nothing on it is public. Read this section once and you will not be " +
      "surprised on the 19th.",
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
          "$700 to the winning team, with a big box of Cocoa Dolce chocolates",
        ],
      },
      {
        kind: "list",
        label: "Pitch Track — pitch something they should do",
        items: [
          "Answer by making the case: a recommendation Cocoa Dolce could act on, backed by real evidence",
          "You submit a pitch video and a demo that makes the idea tangible — a mock landing page, a concept prototype, a data visualization",
          "Judged on the strength of the argument and the evidence behind it",
          "$500 to the winning team, with a big box of Cocoa Dolce chocolates",
        ],
      },
      {
        kind: "text",
        label: "Why the prizes are unequal",
        body:
          "Build pays more because it is the heavier lift. That is a deliberate " +
          "weighting, not a statement about which work matters. One cash prize per " +
          "track: the winning team takes the money and a big box of Cocoa Dolce " +
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
          "Teams were LOCKED at registration. No adding, swapping, or merging members now, and no team formation on event day.",
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
          "Can we change our team? No. Teams locked at registration on September 10.",
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
