/* ═══════════════════════════════════════════════════════════════════
   SCHEDULE SECTION — finale-day timetable (September 19).

   Source of truth is the Chocolathon Master Document, Part 1,
   "Finale Day Schedule". The doc marks this section tentative, so the
   heading says so — keep that label until the schedule is locked.

   Safe to edit. Rows are plain data: [time, what, optional note].
   ═══════════════════════════════════════════════════════════════════ */

/* `highlight` pulls a row forward — used for the moments a student is
   actually deciding on: the workshops, lunch, and the public finals. */
type Row = {
  time: string;
  what: string;
  /* Rendered bold on its own line, above the description. */
  speaker?: string;
  note?: string;
  highlight?: boolean;
};

const SCHEDULE: Row[] = [
  { time: "8:30 AM", what: "Doors open", note: "Coffee, pastries, and Cocoa Dolce chocolates" },
  { time: "9:15 AM", what: "Opening ceremony" },
  { time: "9:30 AM", what: "Teams work and refine" },
  {
    time: "11:30 AM",
    what: "Session 1: Open Source, Open Weights, Open Questions",
    speaker: "Fareeha Amber Ansari · AI Governance Lead, Cargill",
    note:
      "A discussion and Q&A on open-source and open-weight AI models, and " +
      "where government AI policy is heading.",
    highlight: true,
  },
  { time: "12:15 PM", what: "Lunch", note: "Provided by Jimmy John's", highlight: true },
  { time: "1:00 PM", what: "Submissions open" },
  { time: "2:15 PM", what: "Submissions close" },
  {
    time: "2:30 PM",
    what: "Session 2: to be announced",
    note: "Speaker and subject coming soon. Runs during preliminary judging.",
    highlight: true,
  },
  { time: "3:45 PM", what: "Final presentations", note: "Open to the public", highlight: true },
  { time: "4:45 PM", what: "Winners announced" },
  { time: "5:00 PM", what: "Pictures and wrap" },
];

export default function ScheduleSection() {
  return (
    <section
      id="schedule"
      className="border-t border-ink/10 bg-white px-5 py-24"
    >
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="eyebrow mb-4">Finale day · September 19</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            How the day runs.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/70">
            You&rsquo;ve been building since the prompts released on September
            14. This is the day it all comes together: submissions, workshops,
            judging, and the live finals.
          </p>
        </div>

        <ol className="mt-12">
          {SCHEDULE.map((row) => (
            <li
              key={row.time}
              className="flex gap-5 border-t border-ink/10 py-4 first:border-t-0 sm:gap-8"
            >
              <p className="w-20 shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50 sm:w-24 sm:text-xs">
                {row.time}
              </p>
              <div className="min-w-0">
                <p
                  className={
                    row.highlight
                      ? "font-ui text-lg font-semibold leading-snug text-ink"
                      : "font-ui text-lg leading-snug text-ink/80"
                  }
                >
                  {row.what}
                </p>
                {row.speaker ? (
                  <p className="mt-1.5 font-ui text-sm font-semibold leading-snug text-ink/85">
                    {row.speaker}
                  </p>
                ) : null}
                {row.note ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
                    {row.note}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        {/* OCPD sits with the day, not with the food (decided 2026-09-06):
            the Barton School's Office of Career and Professional Development
            covers the room, and the industry sessions are the professional
            side of the event, which is what OCPD exists for. Footer lists
            them too. Keep the claim narrow: they support the day; they do
            not run the sessions. */}
        <div className="mx-auto mt-14 flex max-w-lg flex-col items-center gap-4 border-t border-ink/10 pt-10 text-center">
          <img
            src="/chocolathon/sponsors/ocpd.png"
            alt="Office of Career and Professional Development, Barton School of Business"
            className="h-12 w-auto"
          />
          <p className="text-sm leading-relaxed text-ink/60">
            The day at Woolsey Hall is supported by the Barton School&rsquo;s
            Office of Career and Professional Development.
          </p>
        </div>

        <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          Schedule tentative · subject to minor changes
        </p>
      </div>
    </section>
  );
}
