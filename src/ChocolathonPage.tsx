/* ═══════════════════════════════════════════════════════════════════
   ChocolathonPage — the single entry point for the /chocolathon route.

   Drop this component into the wsuaiclub.com router:
     <Route path="/chocolathon" element={<ChocolathonPage />} />

   It is fully self-contained: its styles are scoped under .choco-root
   (see chocolathon.css) and its assets live in /public/chocolathon/.
   See INTEGRATION.md for the three-step install.

   Structure (reset 2026-09-06): the story film (or its mobile
   fallback), the winners once published (2026-09-19), the Competition
   HQ band, the Barton School block, the DTMedia block, the team
   (2026-09-18), the footer. The Tracks, Schedule, and Judges sections that used to stack
   here moved into Competition HQ so every fact lives in one place.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import ScrollFilm from "./film/ScrollFilm";
import Overlay from "./content/Overlay";
import Masthead from "./content/Masthead";
import HqSection from "./content/HqSection";
import WinnersSection from "./content/WinnersSection";
import type { HubData } from "./competitor/types";
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

/* One fetch of /api/hub for the whole landing page: the winners section
   needs the results and the prompt titles. A failed fetch means no
   winners section, never a broken one. */
function useHub(): HubData | null {
  const [hub, setHub] = useState<HubData | null>(null);
  useEffect(() => {
    fetch("/api/hub", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: HubData | null) => setHub(d))
      .catch(() => setHub(null));
  }, []);
  return hub;
}

export default function ChocolathonPage() {
  const filmCapable = useFilmCapable();
  const hub = useHub();

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
      {hub ? <WinnersSection results={hub.results} prompts={hub.prompts} /> : null}
      <HqSection />
      <BackedBySection />
      <CoveredBySection />
      <TeamSection />
      <FooterSection />
    </div>
  );
}
