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
  COCOA_DOLCE_ABOUT_URL,
  HQ_PATH,
  LOVABLE_URL,
  REGISTER_URL,
  REGISTRATION_CLOSE_LABEL,
  registrationOpen,
} from "./links";
import PromptsButton from "./PromptsButton";

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
          <p className="label label-strong mt-5 !text-sm">
            Finale Sat Sep 19, 2026 · 9 AM – 5 PM · Woolsey Hall, WSU
          </p>
        </div>
        {/* No sponsor marks in the hero (decided 2026-09-06 after trying a
            row, flank columns, a marquee, and a scattered constellation):
            the box owns the first screen, the eyebrow names the co-hosts,
            and the film uncovers the sponsors beat by beat before the
            footer lists them. The one control down here is the prompts
            button: locked with the live countdown until midnight on the
            14th, then the amber link into HQ. It sits BELOW the box photo —
            in the title block it overlapped the product shot. */}
        <div className="flex w-full flex-col items-center gap-5">
          <PromptsButton />
          <p className="scroll-hint label">
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
          working prototype, or pitch them a business case. Real problems from
          inside a real company, judged by the people who run it.
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
        {/* Two dates and a room — nothing else. The mechanics are the
            green "How it works" panel; the two used to say the same
            thing twice (fixed 2026-09-10). */}
        <p className="eyebrow mb-3">When &amp; where</p>
        <dl className="space-y-3 border-l-2 border-gold pl-5 text-left">
          {[
            ["Prompts unlock", "Monday, September 14"],
            ["The finale", "Saturday, September 19"],
            ["Time", "9 AM – 5 PM"],
            ["Place", "Woolsey Hall, WSU"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="text-lg font-semibold leading-snug text-ink">{v}</dd>
            </div>
          ))}
        </dl>
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
          <li><strong className="text-ink">1.</strong> Teams of one to five, any major.</li>
          <li><strong className="text-ink">2.</strong> Pick one of eight prompts, and build on your own time.</li>
          <li><strong className="text-ink">3.</strong> Submit on finale day, then the top three per track present live.</li>
          <li><strong className="text-ink">4.</strong> Cocoa Dolce picks a winner in each track.</li>
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
        <p className="mt-1 text-sm text-ink/80">
          in scholarships across two tracks, four winning teams
        </p>
        {/* One scholarship per track (decided 2026-09-06): the winning team
            takes the scholarship and a big box of Cocoa Dolce chocolates; second
            place takes the same box, no scholarship. */}
        <dl className="ml-auto mt-5 max-w-[250px] space-y-2 border-r-2 border-gold pr-5 text-right">
          <div className="flex items-baseline justify-end gap-3">
            <dt className="label">
              Build
            </dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">
              $700 scholarship
            </dd>
          </div>
          <div className="flex items-baseline justify-end gap-3">
            <dt className="label">
              Pitch
            </dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">
              $500 scholarship
            </dd>
          </div>
        </dl>
        <p className="ml-auto mt-3 max-w-[240px] text-sm leading-relaxed text-ink/70">
          Plus a big box of Cocoa Dolce chocolates. Second place takes the box
          too.
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
          Open to all WSU students. No coding experience needed: you can build
          with our sponsor Lovable, and every participant gets free credits.
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
          <img src="/chocolathon/sponsors/redbull.svg" alt="Red Bull" className="h-9 w-auto" />
        </div>
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
          {/* Register is the amber action while it lasts (it hides itself on
              the date in ./links, printed under the buttons since the
              2026-09-10 extension); the prompts link is the quiet second
              door and becomes the only one afterwards. */}
          <p className="eyebrow mb-4">Finale September 19</p>
          <h2 className="font-display text-5xl font-semibold tracking-tight text-ink md:text-6xl">
            Pick your team.
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {registrationOpen() ? (
              <>
                <a
                  className="btn-cta"
                  href={REGISTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Register your team
                </a>
                <a className="btn-ghost" href={HQ_PATH}>
                  Competition HQ
                </a>
              </>
            ) : (
              <a className="btn-cta" href={HQ_PATH}>
                Competition HQ
              </a>
            )}
          </div>
          {registrationOpen() ? (
            <p className="label mt-5">{REGISTRATION_CLOSE_LABEL}</p>
          ) : null}
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
