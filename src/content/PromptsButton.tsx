/* ═══════════════════════════════════════════════════════════════════
   PROMPTS BUTTON — the one control that gets a visitor to the prompts.

   Before midnight on September 14 (Wichita time) it is a locked button:
   dashed, a drawn lock, the live countdown inside it, and disabled for
   real. When the clock turns over the same slot becomes the amber
   "See the prompts" link into Competition HQ. Nobody has to find HQ to
   reach the prompts; this sits in the hero on both paths.

   The release instant here is the client's copy of the server clock in
   api/_release.ts. The server is the authority on the CONTENT: even if
   a device clock is wrong, the prompts page shows nothing until the
   server says so. This component only decides what the button looks
   like.

   Seconds are shown so the timer reads as live; tabular numerals and
   zero-padding keep the row from twitching once a second.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

import { PROMPTS_HREF, PROMPTS_RELEASE_AT } from "./links";

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

export default function PromptsButton({ className = "" }: { className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const left = remainingUntil(PROMPTS_RELEASE_AT, now);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (!left) {
    return (
      <a className={`btn-cta ${className}`} href={PROMPTS_HREF}>
        See the prompts
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
      title="The prompts unlock at midnight on September 14, Wichita time."
    >
      <LockIcon />
      <span className="whitespace-nowrap">Prompts unlock Sep 14</span>
      <span className="btn-lock-time whitespace-nowrap" aria-hidden="true">
        {left.days}d {pad(left.hours)}h {pad(left.minutes)}m {pad(left.seconds)}s
      </span>
      <span className="sr-only">
        {left.days} days, {left.hours} hours and {left.minutes} minutes until the
        prompts unlock.
      </span>
    </button>
  );
}
