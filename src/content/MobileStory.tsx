/* Mobile + reduced-motion fallback — the same story as normal scroll
   sections built on the real photography. No scroll-jacking.

   The hero CTA stays here (unlike the desktop film, where the masthead
   carries it and the finale panel pays it off): there is no crown-arc
   payoff on this path, so the ask has to be reachable immediately. */

import { ACTIVE_FORM_URL } from "./links";
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
        <a
          className="btn-cta mt-6"
          href={ACTIVE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Register your team
        </a>
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
          <li><strong className="text-ink">1.</strong> Register solo or with a team of up to four.</li>
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
            ["Registration", "Aug 24 – Sep 10"],
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
          in prizes across two tracks
        </p>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-ink/70">
          In each track: $400 first place plus a large box of Cocoa Dolce
          chocolates, $200 second place plus a medium box.
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink/70">
          Cocoa Dolce provides morning refreshments, coffee and chocolates.
          Jimmy John's provides lunch. You are fed all day, you get two
          live sessions, and you get a room of people to show your work to.
        </p>
        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-ink/80">
          Open to all WSU students, every major, no coding background needed.
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
