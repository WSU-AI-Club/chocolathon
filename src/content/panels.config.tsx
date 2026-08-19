/* ═══════════════════════════════════════════════════════════════════
   PANELS — the editable surface of the experience.

   Each chocolate that rises out of the box carries one of these
   panels. Timing comes from src/film/beats.ts (one shared map for
   chocolate + text). To reword or extend content — including future
   buttons or forms — edit THIS file and src/content/. Never touch
   src/film/.

   Left/right must match the chocolate's side (see the CAST table in
   ScrollFilm): what/how/who = left · when/prizes/sponsors = right.
   ═══════════════════════════════════════════════════════════════════ */

import type { ReactNode } from "react";
import { BEATS, type BeatKey } from "../film/beats";
import {
  ACTIVE_FORM_URL,
  COCOA_DOLCE_ABOUT_URL,
  LOVABLE_URL,
  REGISTRATION_OPEN,
} from "./links";
import Countdown from "./Countdown";

export type Panel = {
  beat: BeatKey;
  position: "center" | "left" | "right";
  node: ReactNode;
};

export type ResolvedPanel = Panel & { from: number; to: number };

const PANELS: Panel[] = [
  /* ── Hero — the open box, introduced ────────────────────────── */
  {
    beat: "hero",
    position: "center",
    node: (
      <div className="flex h-full flex-col items-center justify-between pb-8 pt-24 text-center">
        <div>
          <p className="eyebrow mb-4">WSU AI Club × Cocoa Dolce × Lovable</p>
          <h1 className="font-display text-6xl font-semibold tracking-tight text-ink md:text-8xl">
            Chocolathon
          </h1>
          <p className="mt-2 font-display text-xl italic text-ink/80 md:text-2xl">
            The world&rsquo;s first chocolate hackathon.
          </p>
          <p className="mt-5 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink/70">
            Finale Sat Sep 19, 2026 · 8:30 AM – 5 PM · Woolsey Hall, WSU
          </p>
        </div>
        {/* No CTA in the hero: the masthead Register button is persistent,
            and the finale panel carries the ask once the story has landed.
            The countdown lives down here, BELOW the box photo — in the
            title block it overlapped the product shot. */}
        <div className="flex flex-col items-center gap-3">
          <Countdown />
          <p className="scroll-hint font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Scroll · every chocolate tells you something ↓
          </p>
        </div>
      </div>
    ),
  },

  /* ── Yellow · what it is ────────────────────────────────────── */
  {
    beat: "what",
    position: "left",
    node: (
      <div className="max-w-xs">
        <p className="eyebrow mb-3">What it is</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Build for a real chocolate maker.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/80">
          Cocoa Dolce is Wichita&rsquo;s artisan chocolate maker. Build them a
          working prototype, or pitch them a business case. Either way it is a
          real problem from inside a real company, not a case study someone
          invented for a classroom, and the people who run the business decide
          who wins.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <img src="/chocolathon/sponsors/cocoadolce.png" alt="Cocoa Dolce" className="h-4 w-auto" />
          <a
            className="btn-ghost-sm"
            href={COCOA_DOLCE_ABOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Who they are
          </a>
        </div>
      </div>
    ),
  },

  /* ── Blue · when & where ────────────────────────────────────── */
  {
    beat: "when",
    position: "right",
    node: (
      <div className="max-w-xs">
        {/* Registration dates deliberately live on the countdown, not here.
            This panel is about what the event actually IS. */}
        <p className="eyebrow mb-3">How the event runs</p>
        <ol className="space-y-6 border-l-2 border-gold pl-5 text-left">
          <li>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
              Sep 14
            </p>
            <p className="font-ui text-lg font-semibold leading-snug text-ink">
              Start building
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">
              Prompts release. Build on your own time, at your own pace.
            </p>
          </li>
          <li>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
              Sep 19
            </p>
            <p className="font-ui text-lg font-semibold leading-snug text-ink">
              The finale
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink/60">
              <li>
                Two industry speaker sessions
                <span className="block text-ink/45">
                  including Cargill&rsquo;s AI Governance Lead
                </span>
              </li>
              <li>Project submissions</li>
              <li>Final presentations on stage</li>
              <li>Winners announced</li>
            </ul>
          </li>
        </ol>
      </div>
    ),
  },

  /* ── Green · how it works ───────────────────────────────────── */
  {
    beat: "how",
    position: "left",
    node: (
      <div className="max-w-xs">
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Build ahead. Compete live.
        </h2>
        <ol className="mt-4 space-y-2 text-base leading-relaxed text-ink/80">
          <li><strong className="text-ink">1.</strong> Register solo or with a team of up to four.</li>
          <li><strong className="text-ink">2.</strong> Prompts release September 14. Build on your own time, at your own pace.</li>
          <li><strong className="text-ink">3.</strong> Submit at the finale, September 19, at Woolsey Hall.</li>
          <li><strong className="text-ink">4.</strong> Finalists present live on stage.</li>
        </ol>
      </div>
    ),
  },

  /* ── Red · prizes ───────────────────────────────────────────── */
  {
    beat: "prizes",
    position: "right",
    node: (
      <div className="max-w-xs text-right">
        <p className="eyebrow mb-3">Prizes</p>
        <p className="font-display text-6xl font-semibold text-ink">$1,200</p>
        <p className="mt-1 font-ui text-sm text-ink/80">
          across two tracks, four winning teams
        </p>
        <dl className="ml-auto mt-5 max-w-[250px] space-y-2 border-r-2 border-gold pr-5 text-right">
          <div className="flex items-baseline justify-end gap-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
              Build
            </dt>
            <dd className="font-ui text-lg font-semibold tabular-nums text-ink">
              $500 · $250
            </dd>
          </div>
          <div className="flex items-baseline justify-end gap-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
              Pitch
            </dt>
            <dd className="font-ui text-lg font-semibold tabular-nums text-ink">
              $300 · $150
            </dd>
          </div>
        </dl>
        <p className="ml-auto mt-3 max-w-[240px] text-sm leading-relaxed text-ink/60">
          First and second in each track, plus a box of Cocoa Dolce chocolates.
        </p>
        <p className="ml-auto mt-4 max-w-[240px] font-mono text-xs uppercase tracking-[0.12em] text-gold">
          Refreshments, lunch and two industry speaker sessions
        </p>
      </div>
    ),
  },

  /* ── Teal · who can enter ───────────────────────────────────── */
  {
    beat: "who",
    position: "left",
    node: (
      <div className="max-w-xs">
        <p className="eyebrow mb-3">Who can enter</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Any major. Any skill level.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/80">
          Open to all WSU students. Cocoa Dolce&rsquo;s problems are not all
          software problems: some are about materials and process, some about
          logistics and cost, some about data they do not have yet, some about
          where the business goes next. Whatever you study, one of them is
          already in your lane.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <img src="/chocolathon/sponsors/lovable.png" alt="Lovable" className="h-5 w-auto" />
          <a
            className="btn-ghost-sm"
            href={LOVABLE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            See Lovable
          </a>
        </div>
      </div>
    ),
  },

  /* ── Brown · sponsors ───────────────────────────────────────── */
  {
    beat: "sponsors",
    position: "right",
    node: (
      <div className="max-w-xs text-right">
        <p className="eyebrow mb-3">Fueled by</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink">
          Good taste, all day.
        </h2>
        <div className="mt-6 flex flex-col items-end gap-5">
          <img src="/chocolathon/sponsors/cocoadolce.png" alt="Cocoa Dolce" className="h-5 w-auto" />
          <img src="/chocolathon/sponsors/lovable.png" alt="Lovable" className="h-7 w-auto" />
          <img src="/chocolathon/sponsors/jimmyjohns.webp" alt="Jimmy John's Sandwiches" className="h-14 w-auto" />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ink/70">
          Morning refreshments and chocolates from Cocoa Dolce. AI build
          credits from Lovable. Lunch by Jimmy John&rsquo;s.
        </p>
      </div>
    ),
  },

  /* ── Finale — the crown + the ask ───────────────────────────── */
  {
    beat: "finale",
    position: "center",
    node: (
      <div className="flex h-full flex-col items-center justify-end pb-[7vh] text-center">
        <div className="panel-scrim flex flex-col items-center">
          {/* Flips with the REGISTRATION_OPEN switch in ./links, so this
              line above the main Register button can never go stale. */}
          <p className="eyebrow mb-4">
            {REGISTRATION_OPEN
              ? "Registration closes September 10"
              : "Registration opens August 24"}
          </p>
          <h2 className="font-display text-5xl font-semibold tracking-tight text-ink md:text-6xl">
            Pick your team.
          </h2>
          <p className="mt-4 max-w-md text-base text-ink/80">
            Local AI industry judges review every submission and advance the
            top teams. Finalists present live, where the Cocoa Dolce leadership
            picks the winners. Teams lock at registration and close September 10.
          </p>
          <div className="mt-7">
            <a
              className="btn-cta"
              href={ACTIVE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register your team
            </a>
          </div>
        </div>
      </div>
    ),
  },
];

/** Panels with their bands resolved from the shared beat map. */
export const RESOLVED_PANELS: ResolvedPanel[] = PANELS.map((p) => ({
  ...p,
  from: BEATS[p.beat][0],
  to: BEATS[p.beat][1],
}));
