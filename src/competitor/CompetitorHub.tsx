/* ═══════════════════════════════════════════════════════════════════
   COMPETITION HQ — the reference page (public since 2026-09-06).

   Same palette and type as the landing page so it reads as the same
   event, but no scroll film. A team opens this twenty times and reads
   it on a phone at 1 AM, so it is built to be scanned, linked to, and
   printed. Nothing animates except the countdown.

   No title block: the page opens directly on the prompts, which is
   what people come for. A sticky bar carries the section buttons and
   the Register CTA. Everything on this page arrives from /api/hub.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from "react";

import { REGISTER_URL, registrationOpen } from "../content/links";
import SubmitButton from "../content/SubmitButton";
import type { Block, HubData, Prompt, ResultEntry, Section } from "./types";

export default function CompetitorHub({ data }: { data: HubData }) {
  const navItems = useMemo(
    () => [
      ...(data.results.published ? [{ id: "results", nav: "Results" }] : []),
      { id: "prompts", nav: "Prompts" },
      ...data.sections.map((s) => ({ id: s.id, nav: s.nav })),
    ],
    [data.sections, data.results.published],
  );
  const active = useActiveSection(navItems.map((n) => n.id));

  return (
    <div className="min-h-screen bg-white">
      <HqBar items={navItems} active={active} />

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-28 sm:px-8">
        {data.results.published ? <ResultsSection data={data} /> : null}
        <PromptsSection data={data} />
        {data.sections.map((s) => (
          <SectionBlock key={s.id} section={s} data={data} />
        ))}

        <footer className="mt-24 border-t border-ink/10 pt-8">
          <p className="text-sm leading-relaxed text-ink/80">
            Something here wrong, missing, or unclear? Tell us and we will fix
            it on this page.{" "}
            <a
              href={`mailto:${data.contactEmail}`}
              className="text-ink underline decoration-gold underline-offset-4"
            >
              {data.contactEmail}
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ── sticky bar with the section buttons ─────────────────────────── */

function HqBar({
  items,
  active,
}: {
  items: { id: string; nav: string }[];
  active: string | null;
}) {
  const showRegister = registrationOpen();
  const navRef = useRef<HTMLElement>(null);

  /* On a phone the bar scrolls sideways. Keep the current section's
     button in view so the row always shows where the reader is, and so
     the cut-off label at the edge reads as "more this way". Horizontal
     only: scrollIntoView could also nudge the page. */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !active) return;
    const el = nav.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (!el) return;
    const left = el.offsetLeft - (nav.clientWidth - el.offsetWidth) / 2;
    nav.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.08] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <a href="/" className="label label-strong shrink-0 no-underline">
          <span className="hidden sm:inline">Chocolathon · </span>HQ
        </a>

        {/* Horizontal scroll on a phone rather than wrapping: the bar
            must stay one row tall or it eats the screen. .hq-nav fades
            the right edge on phones so the overflow is visible. */}
        <nav
          ref={navRef}
          className="hq-nav -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] sm:justify-center"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="hq-link"
              aria-current={active === item.id ? "true" : undefined}
            >
              {item.nav}
            </a>
          ))}
        </nav>

        {showRegister ? (
          <a
            href={REGISTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta shrink-0 !min-h-[36px] !px-4 !text-xs"
          >
            Register
          </a>
        ) : (
          <a href="/" className="hq-link shrink-0">
            Event page
          </a>
        )}
      </div>
    </header>
  );
}

function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    const targets = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      /* Top band only: a section counts as "current" once its heading
         clears the fixed bar, not when its tail is still on screen. */
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [key]);

  return active;
}

/* ── results (after the event) ────────────────────────────────────── */

function ResultsSection({ data }: { data: HubData }) {
  const r = data.results;
  const title = (id: string) => data.prompts.find((p) => p.id === id)?.title ?? "";
  return (
    <section id="results" className="mb-24 scroll-mt-20">
      <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-6xl">
        The results.
      </h1>
      {r.intro ? (
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">{r.intro}</p>
      ) : null}
      <div className="mt-10 space-y-14">
        {r.tracks.map((t) => (
          <div key={t.track}>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {t.track === "build" ? "Build Track" : "Pitch Track"}
            </h2>
            <div className="mt-6 space-y-8">
              <ResultCard place="Winner" entry={t.winner} title={title} big />
              <ResultCard place="Second place" entry={t.second} title={title} />
            </div>
            {t.finalists.length ? (
              <p className="mt-6 text-base leading-relaxed text-ink/80">
                <span className="label">Also in the finals</span>
                <br />
                {t.finalists.join(" · ")}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultCard({
  place,
  entry,
  title,
  big = false,
}: {
  place: string;
  entry: ResultEntry;
  title: (id: string) => string;
  big?: boolean;
}) {
  if (!entry.team) return null;
  return (
    <div className="border-l-2 border-gold pl-5">
      <p className="label label-accent">{place}</p>
      <p
        className={
          "mt-1 font-display font-semibold leading-tight tracking-tight text-ink " +
          (big ? "text-3xl" : "text-2xl")
        }
      >
        {entry.team}
      </p>
      {entry.prompt ? (
        <p className="label mt-2">
          {entry.prompt}
          {title(entry.prompt) ? ` · ${title(entry.prompt)}` : ""}
        </p>
      ) : null}
      {entry.line ? (
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/80">{entry.line}</p>
      ) : null}
      {entry.demo || entry.video ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {entry.demo ? (
            <a href={entry.demo} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm">
              See the project
            </a>
          ) : null}
          {entry.video ? (
            <a href={entry.video} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm">
              Watch the video
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ── prompts ──────────────────────────────────────────────────────── */

function PromptsSection({ data }: { data: HubData }) {
  const [track, setTrack] = useState<"build" | "pitch">("build");
  const shown = data.prompts.filter((p) => p.track === track);

  return (
    <section id="prompts" className="scroll-mt-20">
      <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-6xl">
        The prompts.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
        {data.promptsIntro}
      </p>

      {!data.promptsUnlocked ? (
        <PromptsLocked releaseAt={data.releaseAt} />
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Track"
            className="mt-9 inline-flex gap-px overflow-hidden rounded-sm bg-ink/15 p-px"
          >
            {(["build", "pitch"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={track === t}
                onClick={() => setTrack(t)}
                className={
                  "label px-5 py-2.5 transition-colors " +
                  (track === t
                    ? "bg-ink !text-white"
                    : "bg-white hover:!text-ink")
                }
              >
                {t === "build" ? "Build Track" : "Pitch Track"}
              </button>
            ))}
          </div>

          <ol className="mt-8 space-y-px overflow-hidden rounded-sm bg-ink/10">
            {shown.map((p) => (
              <li key={p.id} className="bg-white">
                <a
                  href={`#${p.id}`}
                  className="flex gap-4 px-4 py-3 no-underline transition-colors hover:bg-ink/[0.03]"
                >
                  <span className="label label-accent shrink-0 pt-0.5">{p.id}</span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-ink">
                      {p.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink/80">
                      {p.teaser}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ol>

          <div className="mt-16 space-y-20">
            {shown.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* The countdown is the page until the clock turns over. Seconds shown
   so it reads as live; tabular Fraunces figures and zero-padding keep
   the row from twitching. The parent re-asks the server at zero. */
function PromptsLocked({ releaseAt }: { releaseAt: string }) {
  const left = useCountdown(releaseAt);
  const pad = (n: number) => String(n).padStart(2, "0");

  const units: Array<[string, string]> = left
    ? [
        [String(left.days), left.days === 1 ? "Day" : "Days"],
        [pad(left.hours), left.hours === 1 ? "Hour" : "Hours"],
        [pad(left.minutes), left.minutes === 1 ? "Minute" : "Minutes"],
        [pad(left.seconds), left.seconds === 1 ? "Second" : "Seconds"],
      ]
    : [];

  return (
    <div className="mt-10 border-y border-ink/15 py-10">
      {left ? (
        <>
          <p className="sr-only">
            {left.days} days, {left.hours} hours and {left.minutes} minutes until
            the prompts release.
          </p>
          {/* Fixed column widths: the digits are proportional in the
              loaded Fraunces cut, so a "1" is narrower than a "4" and the
              label under it would drift. Each column is as wide as two
              of the widest digits. */}
          <div aria-hidden="true" className="flex items-start gap-4 sm:gap-6">
            {units.map(([value, label]) => (
              <div key={label} className="w-[4.25rem] text-center sm:w-24">
                <p className="font-display text-5xl font-semibold tabular-nums leading-none text-ink sm:text-7xl">
                  {value}
                </p>
                <p className="label mt-3">{label}</p>
              </div>
            ))}
          </div>
          <p className="label label-accent mt-7">
            Until the prompts unlock · midnight, September 14, Wichita time
          </p>
        </>
      ) : (
        <p className="label label-accent">Releasing now — one moment.</p>
      )}
      <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/80">
        The prompts are not in this page yet, and not in the code behind it.
        Until the clock turns over they exist only on the server. Read the
        rest of this page now.
      </p>
    </div>
  );
}

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function useCountdown(iso: string): Remaining | null {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const ms = target - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <article id={prompt.id} className="scroll-mt-20">
      <div className="flex items-baseline gap-3">
        <span className="label label-accent">{prompt.id}</span>
        {prompt.wildcard ? (
          <span className="label border border-ink/20 px-2 py-0.5 !text-[10px]">
            Wildcard
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
        {prompt.title}
      </h3>
      <div className="mt-7 space-y-7">
        {prompt.blocks.map((b) => (
          <BlockView key={b.label} block={b} />
        ))}
      </div>
    </article>
  );
}

/* ── generic sections ─────────────────────────────────────────────── */

function SectionBlock({ section, data }: { section: Section; data: HubData }) {
  const phone = usePhone();
  return (
    <section id={section.id} className="mt-16 scroll-mt-20 sm:mt-24">
      <div className="border-t border-ink/15 pt-7">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">
          {section.title}
        </h2>
      </div>
      {section.intro ? (
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
          {section.intro}
        </p>
      ) : null}

      {/* The run of day is the schedule section's body. */}
      {section.id === "schedule" ? <RunOfDay rows={data.runOfDay} /> : null}

      {/* Prose blocks fold behind their label on a phone (the label
          states the conclusion; the paragraph is the fine print). Lists,
          steps, and links stay open: they are what people scan for. */}
      <div className="mt-8 space-y-7 sm:mt-9 sm:space-y-8">
        {section.blocks.map((b) => (
          <BlockView key={b.label} block={b} fold={phone} />
        ))}
      </div>

      {/* The submissions button lives in the section that says what to bring. */}
      {section.id === "submissions" ? (
        <div className="mt-10">
          <SubmitButton />
        </div>
      ) : null}
    </section>
  );
}

/* The time column is nowrap and the description wraps, so it fits
   320px unaided. */
function RunOfDay({ rows }: { rows: HubData["runOfDay"] }) {
  return (
    <div className="mt-8">
      <table className="w-full border-collapse text-left">
        <tbody>
          {rows.map((r) => (
            <tr key={r.time} className="border-t border-ink/10">
              <th
                scope="row"
                className={
                  "label whitespace-nowrap py-3 pr-4 align-top !font-medium sm:pr-6 " +
                  (r.flag ? "label-accent" : "")
                }
              >
                {r.time}
              </th>
              <td className="py-3">
                <p
                  className={
                    "text-base leading-snug " +
                    (r.flag ? "font-semibold text-ink" : "text-ink")
                  }
                >
                  {r.what}
                </p>
                {r.who ? (
                  <p className="mt-1 text-sm leading-snug text-ink/80">{r.who}</p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Below Tailwind's sm breakpoint. Used only for the HQ folds; the
   layout itself is CSS. */
function usePhone(): boolean {
  const query = "(max-width: 639px)";
  const [phone, setPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setPhone(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

function BlockView({ block, fold = false }: { block: Block; fold?: boolean }) {
  if (block.kind === "text" && fold) {
    return (
      <details className="hq-fold">
        <summary className="label">
          {block.label}
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="hq-fold-mark h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </summary>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80">
          {block.body}
        </p>
      </details>
    );
  }
  return (
    <div>
      <h4 className="label">{block.label}</h4>
      {block.kind === "text" ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80">
          {block.body}
        </p>
      ) : block.kind === "list" ? (
        <ul className="mt-3 max-w-2xl space-y-2.5 border-l-2 border-gold pl-5">
          {block.items.map((item) => (
            <li key={item} className="text-base leading-relaxed text-ink/80">
              {item}
            </li>
          ))}
        </ul>
      ) : block.kind === "steps" ? (
        <ol className="mt-3 max-w-2xl space-y-3">
          {block.items.map((item, i) => (
            <li key={item} className="flex gap-4 text-base leading-relaxed text-ink/80">
              <span className="font-display w-6 shrink-0 text-xl font-semibold leading-none text-goldink">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : block.kind === "qa" ? (
        <dl className="mt-3 max-w-2xl space-y-4">
          {block.items.map((item) => (
            <div key={item.q}>
              <dt className="text-base font-semibold leading-snug text-ink">{item.q}</dt>
              <dd className="mt-1 text-base leading-relaxed text-ink/80">{item.a}</dd>
            </div>
          ))}
        </dl>
      ) : block.kind === "links" ? (
        <ul className="mt-3 max-w-2xl space-y-2.5 border-l-2 border-gold pl-5">
          {block.items.map((item) => (
            <li key={item.href} className="text-base leading-relaxed">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-gold underline-offset-4 hover:decoration-ink"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        /* 16:9 embeds on the privacy-enhanced domain; two side by side
           when there is room, stacked on a phone. */
        <div className="mt-4 grid max-w-2xl gap-5 sm:grid-cols-2">
          {block.items.map((v) => (
            <figure key={v.id}>
              <div className="relative aspect-video overflow-hidden rounded-sm bg-ink/5">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                  title={v.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <figcaption className="mt-2 text-sm text-ink/80">{v.title}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
