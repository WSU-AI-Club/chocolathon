/* ═══════════════════════════════════════════════════════════════════
   THE TEAM — the AI Club leadership behind Chocolathon (2026-09-18).

   Public, reached from The Team button on the landing page. Names,
   roles, photos, and links come from src/content/team.ts, the same
   file the landing section reads. The page exists so the credit
   outlives the event: it stays up after the 19th. Same bar, palette,
   and type as the people page.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect } from "react";

import TeamGrid from "../content/TeamGrid";
import { CLUB_EMAIL, HQ_PATH, PEOPLE_PATH } from "../content/links";
import "../chocolathon.css";

export default function TeamPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Chocolathon — The team";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="choco-root min-h-screen bg-white">
      <Bar />
      <main className="mx-auto max-w-4xl px-5 pb-32 pt-28 sm:px-8">
        <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-6xl">
          The team.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
          The WSU AI Club leadership who put Chocolathon together, from the
          first call with Cocoa Dolce to the last slide on September 19.
        </p>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/80">
          Not the whole board. The rest of the leadership team is competing.
        </p>

        <div className="mt-14 border-t border-ink/15 pt-12 sm:mt-16 sm:pt-14">
          <TeamGrid />
        </div>

        <footer className="mt-24 border-t border-ink/10 pt-8">
          <p className="text-sm leading-relaxed text-ink/80">
            A name or title wrong? Tell us and we will fix it here.{" "}
            <a
              href={`mailto:${CLUB_EMAIL}`}
              className="text-ink underline decoration-gold underline-offset-4"
            >
              {CLUB_EMAIL}
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

/* Same shape as the people page's bar: home on the left, three doors. */
function Bar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.08] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <a href="/" className="label label-strong shrink-0 no-underline">
          <span className="hidden sm:inline">Chocolathon · </span>The team
        </a>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a href="/" className="hq-link">
            Event page
          </a>
          <a href={PEOPLE_PATH} className="hq-link">
            People
          </a>
          <a href={HQ_PATH} className="hq-link">
            <span className="sm:hidden">HQ</span>
            <span className="hidden sm:inline">Competition HQ</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
