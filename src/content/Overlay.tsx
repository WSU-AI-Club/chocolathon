/* Overlay — positions each configured panel over the stage and fades it
   with scroll progress. Content edits belong in panels.config.tsx;
   this file only does placement math. */

import { useFilmProgress } from "../film/ScrollFilm";
import { RESOLVED_PANELS, type Panel } from "./panels.config";

/** 0→1→0 opacity across a band, with soft edges. Short fades on
    purpose — panels should spend most of their band fully readable. */
function bandOpacity(p: number, from: number, to: number) {
  const fade = Math.min(0.03, (to - from) / 4);
  if (p <= from || p >= to) return 0;
  if (p < from + fade) return (p - from) / fade;
  if (p > to - fade) return (to - p) / fade;
  return 1;
}

/* Side panels sit BELOW their chocolate's hold spot (chocolate hovers
   at ~30vh; text starts beneath it). */
const POS: Record<Panel["position"], string> = {
  center: "inset-0",
  left: "left-[7vw] top-[42vh]",
  right: "right-[7vw] top-[42vh]",
};

export default function Overlay() {
  const p = useFilmProgress();

  return (
    <div className="panel-layer absolute inset-0">
      {RESOLVED_PANELS.map((panel, i) => {
        const opacity = bandOpacity(p, panel.from, panel.to);
        const drift = (1 - opacity) * 14;
        return (
          // Always mounted (never null) so every heading and line of copy
          // stays in the DOM for crawlers — visibility just toggles paint.
          <div
            key={i}
            className={`absolute ${POS[panel.position]}`}
            style={{
              opacity,
              visibility: opacity === 0 ? "hidden" : "visible",
              transform:
                panel.position === "center"
                  ? undefined
                  : `translateY(${drift}px)`,
            }}
          >
            {panel.position === "center" ? (
              panel.node
            ) : (
              <div className="panel-scrim">{panel.node}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
