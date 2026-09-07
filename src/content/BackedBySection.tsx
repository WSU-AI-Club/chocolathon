/* OCPD's block. The Barton School's Office of Career and Professional
   Development covers the room, and it sits with the professional side of
   the event, not with the food (decided 2026-09-06). It used to close the
   finale-day schedule; with the schedule moved into HQ it stands on its
   own between the HQ band and the sponsor footer. The mark alone, large
   (decided 2026-09-06): the alt text and the HQ schedule section carry
   the words. */

export default function BackedBySection() {
  return (
    <section className="border-t border-ink/10 bg-white px-5 py-20 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <img
          src="/chocolathon/sponsors/ocpd.png"
          alt="Office of Career and Professional Development, Barton School of Business"
          className="h-36 w-auto md:h-44"
        />
      </div>
    </section>
  );
}
