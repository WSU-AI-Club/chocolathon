/* ═══════════════════════════════════════════════════════════════════
   MEDALS — gold, silver, bronze for first, second, and third
   (Michael, 2026-09-20).

   One definition shared by the landing page's winners section, HQ's
   results cards, and the submissions gallery, so a place is the same
   colour and the same words everywhere.

   Colours: the metallic tone carries the ring and the rule, which are
   graphics; a darker tone of the same metal carries the text, because
   the site's contrast floor is 5.3:1 on white and the bright metals sit
   at 2.4–3.9:1. Measured, not guessed: goldink 5.1:1, silverink 5.9:1,
   bronzeink 5.9:1.

   The text classes carry `!` on purpose: `.choco-root .label` sets its
   own colour and outranks a bare Tailwind text utility.
   ═══════════════════════════════════════════════════════════════════ */

export type Place = "winner" | "second" | "third";

type Medal = {
  /* "Gold", "Silver", "Bronze" — the metal, said out loud. */
  metal: string;
  /* "Winner", "Second place", "Third place". */
  label: string;
  numeral: string;
  /* Tailwind fragments. Written as whole literals so the JIT scanner
     sees them; a built-up `text-${x}` would never reach the stylesheet. */
  text: string;
  ring: string;
  tint: string;
  rule: string;
};

export const MEDALS: Record<Place, Medal> = {
  winner: {
    metal: "Gold",
    label: "Winner",
    numeral: "1",
    text: "!text-goldink",
    ring: "border-gold",
    tint: "bg-gold/10",
    rule: "border-l-gold",
  },
  second: {
    metal: "Silver",
    label: "Second place",
    numeral: "2",
    text: "!text-silverink",
    ring: "border-silver",
    tint: "bg-silver/10",
    rule: "border-l-silver",
  },
  third: {
    metal: "Bronze",
    label: "Third place",
    numeral: "3",
    text: "!text-bronzeink",
    ring: "border-bronze",
    tint: "bg-bronze/10",
    rule: "border-l-bronze",
  },
};

export const PLACES: Place[] = ["winner", "second", "third"];

/* The medal itself: a ring in the metal, a wash of it inside, the
   numeral in the metal's text tone. Decorative — the words beside it
   say the same thing, so it is hidden from screen readers. */
export function Medal({ place, className = "" }: { place: Place; className?: string }) {
  const m = MEDALS[place];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-base font-semibold tabular-nums ${m.ring} ${m.tint} ${m.text} ${className}`}
    >
      {m.numeral}
    </span>
  );
}

/* "Gold · Winner", in the metal's text tone. */
export function PlaceLabel({ place, className = "" }: { place: Place; className?: string }) {
  const m = MEDALS[place];
  return (
    <p className={`label ${m.text} ${className}`}>
      {m.metal} · {m.label}
    </p>
  );
}

/* The scholarship and the box, when a place carries one.

   A money prize is set in the display face, because the amount is the
   thing people look for. A prize that is not money — second place takes
   home the chocolates and nothing else — stays in the body face: it
   should read under the team name, not level with it. */
export function Prize({
  prize,
  note,
  className = "",
}: {
  prize?: string;
  note?: string;
  className?: string;
}) {
  if (!prize) return null;
  const money = prize.trim().startsWith("$");
  return (
    <p className={`leading-snug ${className}`}>
      <span
        className={
          money
            ? "font-display text-xl font-semibold tracking-tight text-ink"
            : "text-base font-semibold leading-relaxed text-ink"
        }
      >
        {prize}
      </span>
      {note ? <span className="text-base leading-relaxed text-ink/80">, {note}</span> : null}
    </p>
  );
}
