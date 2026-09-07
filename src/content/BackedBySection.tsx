/* OCPD's block. The Barton School's Office of Career and Professional
   Development covers the room, and it sits with the professional side of
   the event, not with the food (decided 2026-09-06). It used to close the
   finale-day schedule; with the schedule moved into HQ it stands on its
   own between the HQ band and the sponsor footer. The mark, large, plus
   two lines: what OCPD is and why it is here. Keep it that brief. */

export default function BackedBySection() {
  return (
    <section className="border-t border-ink/10 bg-white px-5 py-20 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <img
          src="/chocolathon/sponsors/ocpd.png"
          alt="Office of Career and Professional Development, Barton School of Business"
          className="h-36 w-auto md:h-44"
        />
        <h2 className="mt-8 font-display text-2xl font-semibold leading-tight tracking-tight text-ink md:text-3xl">
          Backed by the Barton School.
        </h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-ink/80">
          OCPD is the Barton School&rsquo;s career office, connecting students
          with internships and jobs. They help make the day at Woolsey Hall
          possible.
        </p>
      </div>
    </section>
  );
}
