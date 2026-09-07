/* Persistent top bar. Three controls and nothing else (2026-09-06):
   Competition HQ, Join the AI Club, and Register. The section jumps
   that used to live here are gone; everything they pointed at now
   lives in HQ, one click away. Register is the single amber action and
   hides itself on the date in ./links. On a phone Join drops out (it is
   in the footer) so HQ and Register never wrap. */

import { useEffect, useState } from "react";

import {
  CLUB_JOIN_URL,
  HQ_PATH,
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
        const hq = document.getElementById("hq");
        setSolid(!!hq && hq.getBoundingClientRect().top <= 0);
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
          className="label label-strong shrink-0 no-underline"
        >
          <span className="hidden sm:inline">WSU AI Club · </span>Sep 19
        </a>

        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href={HQ_PATH}
            className="btn-ghost !min-h-[38px] whitespace-nowrap !bg-white !px-4 !text-xs"
          >
            <span className="sm:hidden">HQ</span>
            <span className="hidden sm:inline">Competition HQ</span>
          </a>
          {CLUB_JOIN_URL ? (
            <a
              href={CLUB_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !hidden !min-h-[38px] whitespace-nowrap !bg-white !px-4 !text-xs sm:!inline-flex"
            >
              Join the AI Club
            </a>
          ) : null}
          {showRegister ? (
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta !min-h-[38px] !px-4 !text-xs sm:!px-5"
            >
              Register
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
