/* ═══════════════════════════════════════════════════════════════════
   COUNTDOWN — calm by design.

   Seconds are shown so the timer reads as live (Michael's call). That
   makes two details load-bearing rather than cosmetic:

   1. Tabular numerals + zero-padding, so every digit occupies the same
      width. Without both, the row visibly twitches once a second as
      values change — the single thing that makes a live counter feel
      cheap.
   2. Muted weight and small type, so a once-a-second change stays in
      peripheral vision instead of pulling the eye off the page.

   It also retargets instead of dying: once prompts release it counts to
   the finale, and after the finale it renders nothing at all. A
   countdown sitting at zeroes (or negatives) is worse than none.

   Safe to edit: the two target dates below and the caption strings.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

/* The milestones the timer walks through, in order. It always counts to
   the FIRST one still in the future, so the deadline on screen is always
   the next thing a student can still act on — registration first, since
   that is the only one they can miss.

   Explicit UTC offsets, NOT local time: the countdown must read the same
   for a student in Wichita and a parent in another timezone. Central
   Daylight Time is UTC-5 in September. */
const MILESTONES: Array<{ at: Date; caption: string; spoken: string }> = [
  {
    /* "Closes Thursday, September 10" reads as: you have all of the 10th. */
    at: new Date("2026-09-10T23:59:00-05:00"),
    caption: "Registration closes September 10",
    spoken: "until registration closes on September 10",
  },
  {
    at: new Date("2026-09-14T09:00:00-05:00"),
    caption: "Prompts release September 14",
    spoken: "until prompts release on September 14",
  },
  {
    at: new Date("2026-09-19T08:30:00-05:00"),
    caption: "The finale is September 19",
    spoken: "until the finale on September 19",
  },
];

/* Seconds are displayed, so this has to tick every second. */
const TICK_MS = 1_000;

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function remainingUntil(target: Date, now: number): Remaining | null {
  const ms = target.getTime() - now;
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

function resolve(now: number) {
  for (const m of MILESTONES) {
    const left = remainingUntil(m.at, now);
    if (left) return { left, caption: m.caption, spoken: m.spoken };
  }
  return null;
}

type Variant = "inline" | "stack";

export default function Countdown({
  className = "",
  variant = "inline",
}: {
  className?: string;
  /* "inline" — one quiet line, for the desktop hero where the box photo
     owns the centre of the screen and nothing may sit on top of it.
     "stack"  — three stacked figures, for the mobile hero which has real
     vertical room below the photo. */
  variant?: Variant;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const state = resolve(now);
  if (!state) return null;

  const { left, caption } = state;
  const pad = (n: number) => String(n).padStart(2, "0");

  /* Read once by assistive tech as a sentence. Deliberately NOT an
     aria-live region — announcing every tick would be hostile. Seconds
     are omitted here: they would be stale the instant they were read. */
  const spoken = (
    <p className="sr-only">
      {left.days} days, {left.hours} hours and {left.minutes} minutes{" "}
      {state.spoken}.
    </p>
  );

  if (variant === "inline") {
    return (
      <div className={className}>
        {spoken}
        <p
          aria-hidden="true"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55"
        >
          <span className="text-gold">{caption}</span>
          <span className="mx-2 text-ink/25">|</span>
          <span className="tabular-nums text-ink/75">
            {left.days}d {pad(left.hours)}h {pad(left.minutes)}m{" "}
            {pad(left.seconds)}s
          </span>
        </p>
      </div>
    );
  }

  /* Padded so the four columns keep a fixed width as they tick. */
  const units: Array<[string, string]> = [
    [String(left.days), left.days === 1 ? "Day" : "Days"],
    [pad(left.hours), left.hours === 1 ? "Hour" : "Hours"],
    [pad(left.minutes), left.minutes === 1 ? "Minute" : "Minutes"],
    [pad(left.seconds), left.seconds === 1 ? "Second" : "Seconds"],
  ];

  return (
    <div className={className}>
      {spoken}
      <div aria-hidden="true">
        <div className="flex items-start justify-center gap-5 sm:gap-7">
          {units.map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-3xl font-medium tabular-nums leading-none text-ink sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/45">
                {label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
          {caption}
        </p>
      </div>
    </div>
  );
}
