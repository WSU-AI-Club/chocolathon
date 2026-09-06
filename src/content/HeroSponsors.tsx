/* ═══════════════════════════════════════════════════════════════════
   HERO SPONSORS — the five marks on the first screen.

   Chosen 2026-09-06 from three candidates (flank columns, a marquee
   band, this): a constellation. The marks are scattered around the box
   at different sizes with a slight tilt each, the way the chocolates
   later float out of the tray.

   Placement rule: every mark lives INSIDE the middle region of the hero,
   the band between the title block and the countdown, positioned as a
   percentage of that region's height. Anchoring to viewport height put
   them into the title on short windows; anchoring to the region cannot.
   Horizontally nothing enters the box's column (roughly 36–64vw).

   Sizes scale with the viewport through clamp() so a 13" laptop and a
   27" monitor both read the marks at the same relative weight. The
   wordmarks (Cocoa Dolce, Lovable) are wide and thin, the badges
   (Jimmy John's, OCPD) are tall, Red Bull sits between; equal heights
   would make the wordmarks read as banners and the badges as icons.

   Below `lg` the gutters are too narrow for the scatter, so the marks
   fall back to a slow marquee band between the box and the countdown.
   Both are in the hero panel, so they fade with the hero beat.
   ═══════════════════════════════════════════════════════════════════ */

type Mark = { src: string; alt: string };

const COCOA: Mark = { src: "/chocolathon/sponsors/cocoadolce.png", alt: "Cocoa Dolce" };
const LOVABLE: Mark = { src: "/chocolathon/sponsors/lovable.png", alt: "Lovable" };
const JJ: Mark = { src: "/chocolathon/sponsors/jimmyjohns.webp", alt: "Jimmy John's Sandwiches" };
const REDBULL: Mark = { src: "/chocolathon/sponsors/redbull.svg", alt: "Red Bull" };
const OCPD: Mark = {
  src: "/chocolathon/sponsors/ocpd.png",
  alt: "Office of Career and Professional Development, Barton School of Business",
};

/* ── constellation (lg and up) ────────────────────────────────────── */

/* `pos` is where the mark sits in the middle region; `size` is its
   height, clamped between a floor for legibility and a ceiling so a
   tall monitor does not blow the badges up past the box. */
const SPOTS: Array<{ mark: Mark; pos: string; size: string; tilt: string }> = [
  {
    mark: COCOA,
    pos: "left-[6vw] top-[14%]",
    size: "h-[clamp(1.5rem,4vh,2.25rem)]",
    tilt: "-rotate-3",
  },
  {
    mark: LOVABLE,
    pos: "left-[10vw] top-[64%]",
    size: "h-[clamp(2rem,5.5vh,3rem)]",
    tilt: "rotate-2",
  },
  {
    mark: JJ,
    pos: "right-[9vw] top-[6%]",
    size: "h-[clamp(4rem,12vh,6.5rem)]",
    tilt: "rotate-6",
  },
  {
    mark: REDBULL,
    pos: "right-[22vw] top-[56%]",
    size: "h-[clamp(2.5rem,6.5vh,3.5rem)]",
    tilt: "-rotate-3",
  },
  {
    mark: OCPD,
    pos: "right-[6vw] top-[74%]",
    size: "h-[clamp(2.5rem,6.5vh,3.5rem)]",
    tilt: "rotate-2",
  },
];

/** Fills the hero's middle region. Render it inside a `relative` box
    that sits between the title block and the countdown block. */
export function HeroSponsorsConstellation() {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden lg:block"
      aria-label="Partners and sponsors"
    >
      {SPOTS.map((s) => (
        <img
          key={s.mark.alt}
          src={s.mark.src}
          alt={s.mark.alt}
          draggable={false}
          className={`absolute w-auto ${s.pos} ${s.size} ${s.tilt}`}
        />
      ))}
    </div>
  );
}

/* ── marquee band (below lg) ──────────────────────────────────────── */

const BAND: Array<{ mark: Mark; size: string }> = [
  { mark: COCOA, size: "h-7" },
  { mark: LOVABLE, size: "h-9" },
  { mark: JJ, size: "h-16" },
  { mark: REDBULL, size: "h-12" },
  { mark: OCPD, size: "h-12" },
];

/** Two copies of the run, translated by exactly one run's width, so the
    loop is seamless. Sits in the bottom block above the countdown. */
export function HeroSponsorsBand() {
  const run = (key: string, hidden: boolean) => (
    <div
      key={key}
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-20 pr-20"
    >
      {BAND.map((b) => (
        <img
          key={b.mark.alt}
          src={b.mark.src}
          alt={b.mark.alt}
          draggable={false}
          className={`${b.size} w-auto`}
        />
      ))}
    </div>
  );
  return (
    <div
      className="sponsor-marquee relative w-full overflow-hidden py-2 lg:hidden"
      aria-label="Partners and sponsors"
    >
      <div className="sponsor-marquee-track flex w-max">
        {run("a", false)}
        {run("b", true)}
      </div>
    </div>
  );
}
