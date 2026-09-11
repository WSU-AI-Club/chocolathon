/* Mobile + reduced-motion fallback — the same story as normal scroll
   sections built on the real photography. No scroll-jacking.

   The hero CTA stays here (unlike the desktop film, where the masthead
   carries it and the finale panel pays it off): there is no crown-arc
   payoff on this path, so the ask has to be reachable immediately. It
   hides itself on the date in ./links and the prompts link remains. */

import { HQ_PATH, REGISTER_URL, REGISTRATION_CLOSE_LABEL, registrationOpen } from "./links";
import PromptsButton from "./PromptsButton";

const SPRITES = [
  "/chocolathon/sprites/yellow.webp",
  "/chocolathon/sprites/blue.webp",
  "/chocolathon/sprites/green.webp",
  "/chocolathon/sprites/red.webp",
  "/chocolathon/sprites/teal.webp",
  "/chocolathon/sprites/brown.webp",
];

export default function MobileStory() {
  return (
    <div>
      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <p className="eyebrow mb-4">WSU AI Club × Cocoa Dolce × Lovable</p>
        <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">
          Chocolathon
        </h1>
        <p className="mt-2 font-display text-lg italic text-ink/80">
          The world&rsquo;s first chocolate hackathon.
        </p>
        <img
          src="/chocolathon/box.webp"
          alt="An open navy Cocoa Dolce chocolate box filled with colorful hand-painted bonbons"
          className="my-8 w-full max-w-sm"
          width={1000}
          height={1000}
        />
        <p className="label label-strong">
          Finale Sat Sep 19, 2026 · 9 AM – 5 PM · Woolsey Hall
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <PromptsButton />
          {registrationOpen() ? (
            <a
              className="btn-cta"
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register your team
            </a>
          ) : null}
          <a className="btn-ghost" href={HQ_PATH}>
            Competition HQ
          </a>
        </div>
        {registrationOpen() ? (
          <p className="label mt-5">{REGISTRATION_CLOSE_LABEL}</p>
        ) : null}
      </section>

      {/* What it is */}
      <section className="px-6 py-14 text-center">
        <p className="eyebrow mb-3">What it is</p>
        <h2 className="font-display text-3xl font-semibold text-ink">
          Build for a real chocolate maker.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink/80">
          Cocoa Dolce is Wichita&rsquo;s artisan chocolate maker. Build them a
          working prototype, or pitch them a business case. Not every problem
          is a software problem, and the people who run the business decide
          who wins.
        </p>
      </section>

      {/* How it works — the mechanics, kept distinct from the premise above. */}
      <section className="px-6 py-14 text-center">
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="font-display text-3xl font-semibold text-ink">
          Build ahead. Compete live.
        </h2>
        <ol className="mx-auto mt-5 max-w-md space-y-2 text-left text-base leading-relaxed text-ink/80">
          <li><strong className="text-ink">1.</strong> Teams of one to five, any major.</li>
          <li><strong className="text-ink">2.</strong> Pick one of eight prompts, and build on your own time.</li>
          <li><strong className="text-ink">3.</strong> Submit on finale day, then the top three per track present live.</li>
          <li><strong className="text-ink">4.</strong> Cocoa Dolce picks a winner in each track.</li>
        </ol>
      </section>

      {/* The chocolates carry the facts on desktop; here they're a band. */}
      <div className="flex justify-center gap-1 overflow-hidden px-6" aria-hidden="true">
        {SPRITES.map((s) => (
          <img key={s} src={s} alt="" className="w-14 mix-blend-multiply" loading="lazy" />
        ))}
      </div>

      {/* Details */}
      <section className="px-6 py-14">
        <dl className="mx-auto max-w-xs space-y-3 border-l-2 border-gold pl-5">
          {[
            ["Prompts unlock", "Monday, September 14, midnight"],
            ["Finale", "Saturday, September 19"],
            ["Time", "9:00 AM – 5:00 PM"],
            ["Place", "Woolsey Hall, WSU"],
            ["Teams", "1–5 people, every major"],
            ["Experience", "None required"],
            ["Cost", "Free, food provided"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label">
                {k}
              </dt>
              <dd className="text-lg font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Prizes. The same ruled list as the details above, so the money
          scans in three lines instead of three paragraphs. Who may enter
          is in the details (Teams, Experience); Lovable, the judges, and
          the food are one line each in HQ, one tap below. */}
      <section className="px-6 py-14">
        <div className="text-center">
          <p className="eyebrow mb-3">Prizes</p>
          <p className="font-display text-5xl font-semibold text-ink">$1,200</p>
          <p className="mt-1 text-sm text-ink/80">in scholarships, four winning teams</p>
        </div>
        <dl className="mx-auto mt-8 max-w-xs space-y-3 border-l-2 border-gold pl-5">
          {[
            ["Build Track", "$700 to the winning team"],
            ["Pitch Track", "$500 to the winning team"],
            ["Winners and runners-up", "A big box of Cocoa Dolce chocolates"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="text-lg font-semibold leading-snug text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mx-auto mt-8 max-w-xs text-center text-sm leading-relaxed text-ink/70">
          Fed all day by Cocoa Dolce, Jimmy John&rsquo;s, and Red Bull. Three
          industry speaker sessions. Lovable credits for every team.
        </p>
      </section>

      {/* No sponsors block here: FooterSection renders partners and
          sponsors for BOTH paths, and duplicating them showed the logos
          twice on mobile. */}
    </div>
  );
}
