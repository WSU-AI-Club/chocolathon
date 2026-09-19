/* ═══════════════════════════════════════════════════════════════════
   ChocolathonPage — the single entry point for the /chocolathon route.

   Drop this component into the wsuaiclub.com router:
     <Route path="/chocolathon" element={<ChocolathonPage />} />

   It is fully self-contained: its styles are scoped under .choco-root
   (see chocolathon.css) and its assets live in /public/chocolathon/.
   See INTEGRATION.md for the three-step install.

   Structure (reset 2026-09-06): the story film (or its mobile
   fallback), the Competition HQ band, the Barton School block, the
   DTMedia block, the team (2026-09-18), the footer. The Tracks, Schedule, and Judges sections that used to stack
   here moved into Competition HQ so every fact lives in one place.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import ScrollFilm from "./film/ScrollFilm";
import Overlay from "./content/Overlay";
import Masthead from "./content/Masthead";
import HqSection from "./content/HqSection";
import BackedBySection from "./content/BackedBySection";
import CoveredBySection from "./content/CoveredBySection";
import TeamSection from "./content/TeamSection";
import FooterSection from "./content/FooterSection";
import MobileStory from "./content/MobileStory";
import "./chocolathon.css";

/* The choreography runs on desktop with motion allowed. Phones and
   reduced-motion users get the same story as normal scroll sections. */
function useFilmCapable() {
  const query = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
  const [capable, setCapable] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setCapable(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return capable;
}

export default function ChocolathonPage() {
  const filmCapable = useFilmCapable();

  return (
    <div id="chocolathon-top" className="choco-root">
      <Masthead deferSurface={filmCapable} />
      {filmCapable ? (
        <ScrollFilm>
          <Overlay />
        </ScrollFilm>
      ) : (
        <MobileStory />
      )}
      <HqSection />
      <BackedBySection />
      <CoveredBySection />
      <TeamSection />
      <FooterSection />
    </div>
  );
}
