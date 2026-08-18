/* Persistent top bar: club badge, section jumps, and the always-available
   Register CTA. This bar is the ONLY register affordance until the finale,
   so it stays visible for the whole scroll. */

import { ACTIVE_FORM_URL, CLUB_JOIN_URL } from "./links";

export default function Masthead() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        {/* No club mark here: the current logo is a placeholder and read
            badly beside the professionally designed partner logos. Text
            only until a real mark exists. */}
        <a
          href="#chocolathon-top"
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50 no-underline"
        >
          <span className="hidden sm:inline">WSU AI Club · </span>Sep 19
        </a>

        {/* Section jumps collapse below md so the two CTAs never wrap on a
            phone. The Join label shortens on small screens for the same
            reason. */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#tracks" className="masthead-link hidden md:inline-flex">
            Tracks
          </a>
          <a href="#schedule" className="masthead-link hidden md:inline-flex">
            Schedule
          </a>
          <a href="#judges" className="masthead-link hidden md:inline-flex">
            Judges
          </a>
          {/* White, not amber: Register has to stay the single primary
              action up here. Explicit white background rather than the
              transparent btn-ghost, because this bar floats over the
              scrolling photography and must stay legible. */}
          {CLUB_JOIN_URL ? (
            <a
              href={CLUB_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost ml-1 !min-h-[40px] !bg-white !px-4 !text-xs sm:ml-2 sm:!px-5"
            >
              <span className="sm:hidden">Join Club</span>
              <span className="hidden sm:inline">Join the AI Club</span>
            </a>
          ) : null}
          <a
            href={ACTIVE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta !min-h-[40px] !px-4 !text-xs sm:!px-5"
          >
            Register
          </a>
        </nav>
      </div>
    </header>
  );
}
