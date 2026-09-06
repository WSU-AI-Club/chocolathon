/* Mobile + reduced-motion fallback — the same story as normal scroll
   sections built on the real photography. No scroll-jacking.

   The hero Register CTA was removed 2026-09-06: registration is a
   separate form that closed September 10, and the page launches after
   that. The masthead's Join-the-club button is the only CTA up top;
   Competitor HQ is reachable from the footer. */

import Countdown from "./Countdown";

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
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink/60">
          Finale Sat Sep 19, 2026 · 8:30 AM – 5 PM · Woolsey Hall
        </p>
        <Countdown className="mt-9" variant="stack" />
      </section>

      {/* What it is */}
      <section className="px-6 py-14 text-center">
        <p className="eyebrow mb-3">What it is</p>
        <h2 className="font-display text-3xl font-semibold text-ink">
          Build for a real chocolate maker.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink/80">
          Cocoa Dolce is Wichita&rsquo;s artisan chocolate maker. Build them a
          working prototype, or pitch them a business case. Either way it is a
          real problem from inside a real company, not a case study someone
          invented for a classroom, and the people who run the business decide
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
          <li><strong className="text-ink">1.</strong> Teams of one to four, any major.</li>
          <li><strong className="text-ink">2.</strong> Prompts release September 14. Build on your own time, at your own pace.</li>
          <li><strong className="text-ink">3.</strong> Submit at the finale, September 19, at Woolsey Hall.</li>
          <li><strong className="text-ink">4.</strong> Finalists present live on stage.</li>
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
            ["Prompts release", "Monday, September 14"],
            ["Finale", "Saturday, September 19"],
            ["Time", "8:30 AM – 5:00 PM"],
            ["Place", "Woolsey Hall, WSU"],
            ["Teams", "1–4 people, every major"],
            ["Experience", "None required"],
            ["Cost", "Free, food provided"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
                {k}
              </dt>
              <dd className="font-ui text-lg font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Prizes + who */}
      <section className="px-6 py-14 text-center">
        <p className="eyebrow mb-3">Prizes</p>
        <p className="font-display text-5xl font-semibold text-ink">$1,200</p>
        <p className="mt-1 text-sm text-ink/80">
          across two tracks, four winning teams
        </p>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-ink/70">
          Build Track: $700 to the winning team. Pitch Track: $500 to the
          winning team. Each winner also takes home a big box of Cocoa Dolce
          chocolates, and second place in each track takes the same box.
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink/70">
          Cocoa Dolce provides morning refreshments, coffee and chocolates.
          Jimmy John's provides lunch. Red Bull keeps the drinks coming all
          day. You are fed all day, you get two industry speaker sessions,
          and a room of people to show your work to.
        </p>
        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-ink/80">
          Open to all WSU students, any major, any skill level. Cocoa
          Dolce&rsquo;s problems are not all software problems: some are about
          materials and process, some about logistics and cost, some about data
          they do not have yet.
          You can build with our sponsor Lovable, an AI platform that turns
          ideas into working software, and every participant gets free
          credits. Local AI industry judges advance the top teams, and the
          Cocoa Dolce leadership picks the winners live.
        </p>
      </section>

      {/* No sponsors block here: FooterSection renders partners and
          sponsors for BOTH paths, and duplicating them showed the logos
          twice on mobile. */}
    </div>
  );
}
