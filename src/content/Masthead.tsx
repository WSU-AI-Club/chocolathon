/* Persistent top bar. Two controls and nothing else (2026-09-10):
   Competition HQ and Register. The section jumps that used to live
   here are gone; everything they pointed at now lives in HQ, one click
   away. Join the AI Club left the bar on 2026-09-10; the footer's Join
   button does that job. Register is the single amber action and hides
   itself on the date in ./links. The bar spans the viewport (no
   max-width) so the controls sit near the edges on a wide screen. */

import { useEffect, useState } from "react";

import { HQ_PATH, REGISTER_URL, registrationOpen } from "./links";

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
      <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-8">
        {/* The club's icon (the real mark, delivered 2026-09-14; the old
            placeholder never sat here) next to the name. The icon carries
            no wordmark, so the text stays. The wide logo is the footer's. */}
        <a
          href="#chocolathon-top"
          className="label label-strong flex shrink-0 items-center gap-2.5 no-underline"
        >
          <img
            src="/chocolathon/club/ai-club-icon.png"
            alt=""
            aria-hidden="true"
            className="h-7 w-auto"
          />
          <span>
            <span className="hidden sm:inline">WSU AI Club · </span>Sep 19
          </span>
        </a>

        <div className="flex flex-col items-end gap-1.5">
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href={HQ_PATH}
              className="btn-ghost !min-h-[38px] whitespace-nowrap !bg-white !px-4 !text-xs"
            >
              <span className="sm:hidden">HQ</span>
              <span className="hidden sm:inline">Competition HQ</span>
            </a>
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
          {/* The 2026-09-10 extension, announced where the Register button
              is. It leaves with the button on the 13th. */}
          {showRegister ? (
            <p className="label label-alert !text-[10.5px] sm:!text-[11px]">
              <span className="sm:hidden">Deadline extended · Sep 13</span>
              <span className="hidden sm:inline">
                Registration deadline extended to September 13
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
