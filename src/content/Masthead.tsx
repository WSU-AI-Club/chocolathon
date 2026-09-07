/* Persistent top bar: club badge, section jumps, the Join-the-club CTA,
   and the Register CTA. Register is the single amber action up here
   while it lasts; it hides itself on the date in ./links and Join stays. */

import { useEffect, useState } from "react";

import {
  CLUB_JOIN_URL,
  PROMPTS_PATH,
  REGISTER_URL,
  registrationOpen,
} from "./links";

export default function Masthead({
  deferSurface = false,
}: {
  /* True while the scroll film is running. The crown parks its highest
     chocolates at ~0.13 x viewport height, which is exactly where a solid
     bar sits, so the surface would clip the payoff of the whole animation.
     While the film runs the bar stays transparent (the crown is centred and
     the controls are at the edges, so nothing actually collides); the
     surface fades in once the stacked sections start scrolling underneath,
     which is the only place it was needed. */
  deferSurface?: boolean;
}) {
  const [solid, setSolid] = useState(!deferSurface);
  const showRegister = registrationOpen();

  useEffect(() => {
    const onScroll = () => {
      if (deferSurface) {
        const tracks = document.getElementById("tracks");
        setSolid(!!tracks && tracks.getBoundingClientRect().top <= 0);
      } else {
        setSolid(window.scrollY > 8);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [deferSurface]);

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300 " +
        (solid
          ? "border-b border-ink/[0.08] bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent")
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        {/* No club mark here: the current logo is a placeholder and read
            badly beside the professionally designed partner logos. Text
            only until a real mark exists. */}
        <a
          href="#chocolathon-top"
          className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink/75 no-underline"
        >
          <span className="hidden sm:inline">WSU AI Club · </span>Sep 19
        </a>

        {/* Section jumps collapse below md so the CTA never wraps on a
            phone. The Join label shortens on small screens for the same
            reason. */}
        <nav className="flex items-center gap-0.5">
          <a href="#tracks" className="masthead-link hidden md:inline-flex">
            Tracks
          </a>
          <a href="#schedule" className="masthead-link hidden md:inline-flex">
            Schedule
          </a>
          <a href="#judges" className="masthead-link hidden md:inline-flex">
            Judges
          </a>
          <a href={PROMPTS_PATH} className="masthead-link hidden md:inline-flex">
            Prompts
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
              className="btn-ghost ml-2 !min-h-[38px] whitespace-nowrap !bg-white !px-4 !text-xs sm:ml-3"
            >
              <span className="sm:hidden">Join Club</span>
              <span className="hidden sm:inline">Join the AI Club</span>
            </a>
          ) : null}
          {showRegister ? (
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta ml-2 !min-h-[38px] !px-4 !text-xs sm:!px-5"
            >
              Register
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
