/* ═══════════════════════════════════════════════════════════════════
   BEATS — the single source of truth for the scroll timeline.

   Each beat is a [start, end] band of scroll progress (0 = top of the
   page, 1 = end of the experience). The choreography (ScrollFilm) and
   the content panels (panels.config) both read from THIS map, so the
   chocolate and its text always move together.

   To retime a beat, change it here — nowhere else.
   ═══════════════════════════════════════════════════════════════════ */

export const BEATS = {
  hero: [-0.1, 0.09],
  what: [0.1, 0.22],
  when: [0.24, 0.36],
  how: [0.38, 0.5],
  prizes: [0.52, 0.64],
  who: [0.66, 0.78],
  sponsors: [0.8, 0.9],
  finale: [0.92, 1.15],
} as const;

export type BeatKey = keyof typeof BEATS;
