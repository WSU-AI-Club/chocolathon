/* ═══════════════════════════════════════════════════════════════════
   TIMED BUTTON — a control that is locked until an instant, then live.

   Two uses (2026-09-06): the prompts button (locked until midnight
   September 14, then the amber link into HQ) and the submissions button
   (locked until 9:00 AM on September 19, then the amber link to the
   Microsoft Form). Same look for both so a visitor learns the pattern
   once: dashed, a drawn lock, the live countdown inside, disabled for
   real; then amber.

   The instant is the client's copy of the clock. For the prompts the
   server still decides the CONTENT, so a wrong device clock can only
   change what the button looks like, never leak a prompt. For the
   submissions the form enforces its own window, so an early click just
   meets a closed form.

   Seconds are shown so the timer reads as live; tabular numerals and
   zero-padding keep the row from twitching once a second.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

const TICK_MS = 1_000;

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

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

function LockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="10" height="7.5" rx="1" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export default function TimedButton({
  opensAt,
  href,
  lockedLabel,
  openLabel,
  title,
  external = false,
  className = "",
}: {
  /* The instant the control goes live. */
  opensAt: Date;
  /* Where it goes once live. An empty href keeps it locked past the
     instant with a "link coming" label, so a missing URL can never ship
     a dead amber button. */
  href: string;
  lockedLabel: string;
  openLabel: string;
  /* Tooltip while locked. */
  title: string;
  external?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const left = remainingUntil(opensAt, now);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (!left && href) {
    return (
      <a
        className={`btn-cta ${className}`}
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {openLabel}
        <span aria-hidden="true">→</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className={`btn-lock ${className}`}
      title={title}
    >
      <LockIcon />
      <span className="whitespace-nowrap">{lockedLabel}</span>
      {left ? (
        <>
          <span className="btn-lock-time whitespace-nowrap" aria-hidden="true">
            {left.days}d {pad(left.hours)}h {pad(left.minutes)}m {pad(left.seconds)}s
          </span>
          <span className="sr-only">
            {left.days} days, {left.hours} hours and {left.minutes} minutes to go.
          </span>
        </>
      ) : (
        <span className="btn-lock-time whitespace-nowrap">Link coming</span>
      )}
    </button>
  );
}
