/* ═══════════════════════════════════════════════════════════════════
   ScrollFilm — ANIMATION ENGINE. DO NOT MODIFY.

   ⚠️  Lovable / AI editors: this file is the scroll choreography that
   powers the whole page. Every edit request about copy, buttons,
   panels, or forms belongs in src/content/ — never here. Changing
   this file risks breaking the entire experience.

   How it works
   ────────────
   · A tall scroll track with a sticky full-viewport stage.
   · The stage shows the REAL open Cocoa Dolce box photo (/box.webp),
     fixed in the lower half. No video, no frames — nothing to blur.
   · Six chocolate sprites (real dome shapes, cut from the brand's
     photography) each own one story beat (see film/beats.ts):
       1. rise out of their spot in the tray,
       2. fly to the side and hold beside that beat's text panel,
       3. then tuck into a "crown" arc above the box, where they stay.
     By the finale all six are parked in the crown — the whole event
     laid out around the box.
   · Everything is driven by one number, scroll progress (0–1), which
     is also published to the content layer via FilmContext. Fully
     reversible — scroll up and the chocolates fly home.
   ═══════════════════════════════════════════════════════════════════ */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BEATS, type BeatKey } from "./beats";

const TRACK_VH = 760;

const FilmContext = createContext(0);
/** Scroll progress 0–1 across the whole experience track. */
export const useFilmProgress = () => useContext(FilmContext);

/* ── The cast ─────────────────────────────────────────────────────
   tray: where this chocolate sits in the box photo (fraction of the
         box image, measured off /box.webp).
   side: where it holds while its text is on screen (viewport fractions).
   slot: its final parking spot in the crown arc.                    */
type Sprite = {
  src: string;
  beat: BeatKey;
  tray: [number, number];
  side: [number, number];
  slot: [number, number];
  spin: number; // degrees of rotation it picks up in flight
};

const CAST: Sprite[] = [
  { src: "/chocolathon/sprites/yellow.webp", beat: "what",     tray: [0.63, 0.57], side: [0.16, 0.30], slot: [0.29, 0.16], spin: -8 },
  { src: "/chocolathon/sprites/blue.webp",   beat: "when",     tray: [0.40, 0.60], side: [0.84, 0.30], slot: [0.375, 0.105], spin: 7 },
  { src: "/chocolathon/sprites/green.webp",  beat: "how",      tray: [0.51, 0.56], side: [0.16, 0.30], slot: [0.46, 0.07], spin: -6 },
  { src: "/chocolathon/sprites/red.webp",    beat: "prizes",   tray: [0.45, 0.65], side: [0.84, 0.30], slot: [0.54, 0.07], spin: 9 },
  { src: "/chocolathon/sprites/teal.webp",   beat: "who",      tray: [0.33, 0.69], side: [0.16, 0.30], slot: [0.625, 0.105], spin: -9 },
  { src: "/chocolathon/sprites/brown.webp",  beat: "sponsors", tray: [0.73, 0.56], side: [0.84, 0.30], slot: [0.71, 0.16], spin: 6 },
];

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function ScrollFilm({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLImageElement>(null);
  const [progress, setProgress] = useState(0);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const track = trackRef.current!;
    const onScroll = () => {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0);
    };
    const onResize = () => {
      forceTick((n) => n + 1); // re-measure the box rect
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* Position of one sprite at the current progress, in viewport px. */
  const place = (s: Sprite, p: number) => {
    const [b0, b1] = BEATS[s.beat];
    const box = boxRef.current?.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!box) return null;

    const trayX = box.left + s.tray[0] * box.width;
    const trayY = box.top + s.tray[1] * box.height;
    const sideX = s.side[0] * vw;
    const sideY = s.side[1] * vh;
    const slotX = s.slot[0] * vw;
    const slotY = s.slot[1] * vh + 0.06 * vh;

    const W = b1 - b0;
    const rise = smooth((p - b0) / (W * 0.32));         // tray → side
    const tuck = smooth((p - b1) / 0.05);               // side → crown slot

    if (p <= b0) return null; // still "inside" the photo

    // gentle scroll-tied bob while holding beside the text
    const bob = Math.sin((p - b0) * 55) * 6 * (1 - tuck) * rise;

    const x = tuck > 0 ? lerp(sideX, slotX, tuck) : lerp(trayX, sideX, rise);
    const yBase = tuck > 0 ? lerp(sideY, slotY, tuck) : lerp(trayY, sideY, rise);
    // arc: lift above the straight line mid-flight
    const arc = Math.sin(Math.PI * rise) * 0.09 * vh * (1 - tuck);

    const scale = tuck > 0 ? lerp(0.62, 0.34, tuck) : lerp(0.16, 0.62, rise);
    const rot = lerp(0, s.spin, rise) * (1 - tuck * 0.5);
    const opacity = Math.min(1, rise * 3);

    return {
      transform: `translate(${x}px, ${yBase - arc + bob}px) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
      opacity,
    };
  };

  /* The box yields at both bookends: smaller and lower under the hero
     title, smaller and higher under the finale CTA. Full size while
     the chocolates are working. */
  const heroT = smooth(progress / 0.12);
  const finT = smooth((progress - 0.9) / 0.06);
  const boxScale = lerp(0.62, 1, heroT) * lerp(1, 0.58, finT);
  const boxShift = lerp(6, 0, heroT) + lerp(0, -12, finT); // vh

  return (
    <div ref={trackRef} style={{ height: `${TRACK_VH}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* The real box, always open, always sharp. */}
        <img
          ref={boxRef}
          src="/chocolathon/box.webp"
          alt="An open navy Cocoa Dolce chocolate box filled with colorful hand-painted bonbons"
          width={1000}
          height={1000}
          className="absolute left-1/2 top-[57%] w-[min(56vw,66vh)] select-none"
          style={{
            transform: `translate(-50%, -50%) translateY(${boxShift}vh) scale(${boxScale})`,
          }}
          draggable={false}
        />

        {/* The cast. mix-blend multiply melts their white corners into the page. */}
        {CAST.map((s) => {
          const st = place(s, progress);
          if (!st) return null;
          return (
            <img
              key={s.src}
              src={s.src}
              alt=""
              aria-hidden="true"
              width={300}
              height={412}
              className="pointer-events-none absolute left-0 top-0 w-[240px] mix-blend-multiply will-change-transform"
              style={st}
              draggable={false}
            />
          );
        })}

        <FilmContext.Provider value={progress}>{children}</FilmContext.Provider>
      </div>
    </div>
  );
}
