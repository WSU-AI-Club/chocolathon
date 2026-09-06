/* ═══════════════════════════════════════════════════════════════════
   ChocolathonPage — the single entry point for the /chocolathon route.

   Drop this component into the wsuaiclub.com router:
     <Route path="/chocolathon" element={<ChocolathonPage />} />

   It is fully self-contained: its styles are scoped under .choco-root
   (see chocolathon.css) and its assets live in /public/chocolathon/.
   See INTEGRATION.md for the three-step install.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import ScrollFilm from "./film/ScrollFilm";
import Overlay from "./content/Overlay";
import Masthead from "./content/Masthead";
import TracksSection from "./content/TracksSection";
import ScheduleSection from "./content/ScheduleSection";
import JudgesSection from "./content/JudgesSection";
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
      <TracksSection />
      <ScheduleSection />
      <JudgesSection />
      {/* RegisterSection was removed 2026-09-06: registration is a separate
          form that closed September 10, and the page launches after that. */}
      <FooterSection />
    </div>
  );
}
