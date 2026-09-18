/* ═══════════════════════════════════════════════════════════════════
   THE PEOPLE — speakers, the preliminary panel, the finals panel.

   Public, linked from the landing page's HQ band (2026-09-10). Every
   name and title arrives from /api/hub (`people`), the same source the
   HQ bar's People button leads here, so a judge is never named two different
   ways. Same palette and type as the rest of the site; ruled rows, no
   cards. Headshots since 2026-09-18: a circle cut from each LinkedIn
   photo, 72px, hairline ring; a person without one gets their initials
   in the display face so every row keeps the same shape.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

import { LinkedInIcon } from "../content/icons";
import { HQ_PATH, REGISTER_URL, registrationOpen } from "../content/links";
import type { HubData, Person } from "../competitor/types";
import "../chocolathon.css";

type State =
  | { status: "loading" }
  | { status: "ready"; data: HubData }
  | { status: "error" };

export default function PeoplePage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    fetch("/api/hub", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: HubData) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = "Chocolathon — Judges and speakers";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="choco-root min-h-screen bg-white">
      <Bar />
      <main className="mx-auto max-w-3xl px-5 pb-32 pt-28 sm:px-8">
        {state.status === "ready" ? (
          <People people={state.data.people} contactEmail={state.data.contactEmail} />
        ) : state.status === "error" ? (
          <p className="max-w-sm text-base leading-relaxed text-ink/80">
            Could not load this page. Try again in a minute.
          </p>
        ) : (
          <p className="label">Loading…</p>
        )}
      </main>
    </div>
  );
}

/* Same shape as the HQ bar: home on the left, two doors, Register. */
function Bar() {
  const showRegister = registrationOpen();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.08] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <a href="/" className="label label-strong shrink-0 no-underline">
          <span className="hidden sm:inline">Chocolathon · </span>People
        </a>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a href="/" className="hq-link">
            Event page
          </a>
          <a href={HQ_PATH} className="hq-link">
            <span className="sm:hidden">HQ</span>
            <span className="hidden sm:inline">Competition HQ</span>
          </a>
          {showRegister ? (
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta shrink-0 !min-h-[36px] !px-4 !text-xs"
            >
              Register
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function People({
  people,
  contactEmail,
}: {
  people: HubData["people"];
  contactEmail: string;
}) {
  return (
    <>
      <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-6xl">
        The people.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
        Who speaks, who scores, and who picks the winners at Woolsey Hall on
        September 19.
      </p>

      {/* ── Speakers ─────────────────────────────────────────────── */}
      <section id="speakers" className="mt-16 scroll-mt-20 sm:mt-24">
        <div className="border-t border-ink/15 pt-7">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">
            Speakers.
          </h2>
        </div>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
          Three sessions during the day, open to everyone and optional. Teams
          may keep working through them.
        </p>
        <ol className="mt-8">
          {people.speakers.map((p) => (
            <li key={p.name} className="border-t border-ink/10 py-6 sm:py-7">
              <div className="grid gap-x-8 gap-y-2 sm:grid-cols-[6.5rem_1fr]">
                <p className="label label-accent pt-1">{p.session?.time}</p>
                <div>
                  <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
                    {p.session?.title}
                  </h3>
                  <PersonLine person={p} className="mt-3" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Judges ───────────────────────────────────────────────── */}
      <section id="judges" className="mt-16 scroll-mt-20 sm:mt-24">
        <div className="border-t border-ink/15 pt-7">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">
            Judges.
          </h2>
        </div>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
          Two rounds. The preliminary panel scores every submission on the
          public rubric and advances the top teams. The finals panel watches
          them present live and picks the winners.
        </p>
        <p className="mt-3">
          <a
            href={`${HQ_PATH}#rubric`}
            className="text-base text-ink underline decoration-gold underline-offset-4 hover:decoration-ink"
          >
            The rubric they score on
          </a>
        </p>

        <Panel
          id="preliminary"
          title="Preliminary panel"
          line="Local AI industry leaders. Two per track, scoring independently."
          people={people.preliminary}
          note={people.preliminaryNote}
        />
        <Panel
          id="finals"
          title="Finals panel"
          line="The Cocoa Dolce leadership. They decide who wins."
          people={people.finals}
          note={people.finalsNote}
        />
      </section>

      <footer className="mt-24 border-t border-ink/10 pt-8">
        <p className="text-sm leading-relaxed text-ink/80">
          A name or title wrong? Tell us and we will fix it here.{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-ink underline decoration-gold underline-offset-4"
          >
            {contactEmail}
          </a>
        </p>
      </footer>
    </>
  );
}

function Panel({
  id,
  title,
  line,
  people,
  note,
}: {
  id: string;
  title: string;
  line: string;
  people: Person[];
  note?: string;
}) {
  return (
    <div id={id} className="mt-12 scroll-mt-20">
      <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-ink/80">{line}</p>
      <ul className="mt-6">
        {people.map((p) => (
          <li key={p.name} className="border-t border-ink/10 py-5">
            <PersonLine person={p} />
          </li>
        ))}
        {note ? (
          <li className="border-t border-ink/10 py-5">
            <p className="text-base leading-relaxed text-ink/80">{note}</p>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/* Name with the LinkedIn mark beside it, then the role line, then the
   optional note. One shape for a speaker and a judge so the page reads
   as one list of people. The mark is the link (44px touch target,
   labelled for screen readers); the name itself stays plain text so
   the row does not read as one big link. */
function Portrait({ person }: { person: Person }) {
  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return person.photo ? (
    <img
      src={person.photo}
      alt=""
      width={72}
      height={72}
      loading="lazy"
      className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-1 ring-ink/10"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-ink/[0.05] font-display text-2xl font-semibold text-ink/70 ring-1 ring-ink/10"
    >
      {initials}
    </span>
  );
}

function PersonLine({ person, className = "" }: { person: Person; className?: string }) {
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <Portrait person={person} />
      <div className="min-w-0">
      <p className="flex items-center gap-1 text-lg font-semibold leading-snug text-ink">
        {person.name}
        {person.linkedin ? (
          <a
            href={person.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on LinkedIn`}
            className="-my-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm transition-opacity hover:opacity-70"
          >
            <LinkedInIcon className="h-5 w-5" />
          </a>
        ) : null}
      </p>
      <p className="mt-1 text-base leading-relaxed text-ink/80">{person.role}</p>
      {person.note ? (
        <p className="mt-1 text-sm leading-relaxed text-ink/80">{person.note}</p>
      ) : null}
      </div>
    </div>
  );
}
