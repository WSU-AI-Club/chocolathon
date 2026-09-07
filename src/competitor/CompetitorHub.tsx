/* ═══════════════════════════════════════════════════════════════════
   THE PROMPTS PAGE — public since 2026-09-06, no logins.

   Same palette, type and restraint as the public page (ink / gold /
   amber, Bodoni display, Archivo body, Space Mono eyebrows) so it reads
   as the same event — but no scroll film. This is a reference document
   a team will open twenty times and read on a phone at 1 AM, so it is
   built to be scanned, linked to, and printed. Nothing animates.

   Everything on this page arrives from /api/hub. There is no content in
   this file.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";

import type { Block, HubData, Prompt, Section } from "./types";

export default function CompetitorHub({ data }: { data: HubData }) {
  const navItems = useMemo(
    () => [
      { id: "prompts", nav: "The prompts" },
      ...data.sections.map((s) => ({ id: s.id, nav: s.nav })),
    ],
    [data.sections],
  );
  const active = useActiveSection(navItems.map((n) => n.id));

  return (
    <div className="min-h-screen bg-white">
      <HubBar />

      <main className="mx-auto max-w-6xl px-5 pb-32 pt-28 sm:px-8">
        <HubHeader data={data} />

        <div className="mt-16 gap-14 lg:grid lg:grid-cols-[180px_minmax(0,1fr)]">
          <SideNav items={navItems} active={active} />

          <div className="min-w-0">
            <PromptsSection data={data} />
            {data.sections.map((s) => (
              <SectionBlock key={s.id} section={s} data={data} />
            ))}

            <footer className="mt-24 border-t border-ink/10 pt-8">
              <p className="text-sm leading-relaxed text-ink/55">
                Something here is wrong, missing, or unclear — tell us and we
                will fix it on this page.{" "}
                <a
                  href={`mailto:${data.contactEmail}`}
                  className="text-ink underline decoration-gold underline-offset-4"
                >
                  {data.contactEmail}
                </a>
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── top bar ──────────────────────────────────────────────────────── */

function HubBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.08] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <a
          href="/"
          className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink/75 no-underline"
        >
          Chocolathon
          <span className="hidden text-ink/40 sm:inline"> · The prompts</span>
        </a>
        <a
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45 no-underline transition-colors hover:text-ink"
        >
          ← Event page
        </a>
      </div>
    </header>
  );
}

/* ── header + key dates ───────────────────────────────────────────── */

function HubHeader({ data }: { data: HubData }) {
  return (
    <>
      <p className="eyebrow mb-4">The 2026 challenge</p>
      <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-6xl">
        The prompts.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/70">
        Everything you need to compete: the eight challenge prompts, the rules,
        how you submit, and how you get judged.
      </p>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-sm bg-ink/10 sm:grid-cols-2">
        {data.keyDates.map((d) => (
          <li key={d.date} className="bg-white px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
              {d.date}
            </p>
            <p className="mt-1.5 text-sm leading-snug text-ink/70">{d.what}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ── side nav ─────────────────────────────────────────────────────── */

function SideNav({
  items,
  active,
}: {
  items: { id: string; nav: string }[];
  active: string | null;
}) {
  return (
    <nav className="mb-12 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 border-l-0 lg:block lg:space-y-1 lg:border-l lg:border-ink/10">
        {items.map((item) => {
          const on = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={
                  "block py-1 font-mono text-[10px] uppercase tracking-[0.14em] no-underline transition-colors lg:-ml-px lg:border-l-2 lg:pl-4 " +
                  (on
                    ? "text-ink lg:border-gold"
                    : "text-ink/40 hover:text-ink/80 lg:border-transparent")
                }
              >
                {item.nav}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
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
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [key]);

  return active;
}

/* ── prompts ──────────────────────────────────────────────────────── */

function PromptsSection({ data }: { data: HubData }) {
  const [track, setTrack] = useState<"build" | "pitch">("build");
  const shown = data.prompts.filter((p) => p.track === track);

  return (
    <section id="prompts" className="scroll-mt-24">
      <SectionHeading
        eyebrow={data.promptsUnlocked ? "Released" : "Locked"}
        title="The prompts"
      />

      {!data.promptsUnlocked ? (
        <PromptsLocked releaseAt={data.releaseAt} />
      ) : (
        <>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/70">
            Eight prompts, four per track. Three are specific problems pulled
            straight off Cocoa Dolce's floor; the fourth in each track is a
            wildcard. <strong className="font-semibold text-ink">Pick one.</strong>{" "}
            You declare which track you are in when you submit, so you can read
            both sides before deciding.
          </p>

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
                  "px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors " +
                  (track === t
                    ? "bg-ink text-white"
                    : "bg-white text-ink/50 hover:text-ink")
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
                  <span className="shrink-0 font-mono text-[11px] font-bold text-gold">
                    {p.id}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-ui text-sm font-semibold text-ink">
                      {p.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink/55">
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

/* The countdown is the page until the clock turns over, so it gets the
   same treatment as the landing page's: seconds shown so it reads as
   live, tabular numerals and zero-padding so the row never twitches,
   and the same stacked figures the mobile hero uses. It ticks every
   second; the parent re-asks the server the moment it hits zero. */
function PromptsLocked({ releaseAt }: { releaseAt: string }) {
  const left = useCountdown(releaseAt);
  const when = new Date(releaseAt);
  const dayLabel = when.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Chicago",
  });
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
    <div className="mt-8">
      <p className="max-w-xl text-base leading-relaxed text-ink/70">
        The eight challenge prompts release at{" "}
        <strong className="font-semibold text-ink">
          midnight on {dayLabel}
        </strong>
        , Wichita time. They are not in this page yet — not hidden in it, not
        in the code behind it. Until the clock turns over, they only exist on
        the server.
      </p>

      {left ? (
        <div className="mt-10 border-y border-ink/10 py-10" aria-live="off">
          <p className="sr-only">
            {left.days} days, {left.hours} hours and {left.minutes} minutes until
            the prompts release.
          </p>
          <div aria-hidden="true" className="flex items-start gap-6 sm:gap-10">
            {units.map(([value, label]) => (
              <div key={label} className="min-w-[3ch] text-center">
                <p className="font-display text-5xl font-semibold tabular-nums leading-none text-ink sm:text-7xl">
                  {value}
                </p>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/45 sm:text-[10px]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
            Until the prompts release
          </p>
        </div>
      ) : (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
          Releasing now — one moment.
        </p>
      )}

      <p className="mt-8 max-w-xl text-sm leading-relaxed text-ink/55">
        Nothing below is on the clock. Read the rules, the submission process
        and the judging criteria now — the teams that place already know all
        three before they see a prompt.
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
    <article id={prompt.id} className="scroll-mt-24">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs font-bold tracking-[0.1em] text-gold">
          {prompt.id}
        </span>
        {prompt.wildcard ? (
          <span className="border border-ink/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
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

function SectionBlock({
  section,
  data,
}: {
  section: Section;
  data: HubData;
}) {
  return (
    <section id={section.id} className="mt-24 scroll-mt-24">
      <SectionHeading title={section.title} />
      {section.intro ? (
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/70">
          {section.intro}
        </p>
      ) : null}

      <div className="mt-9 space-y-8">
        {section.blocks.map((b) => (
          <BlockView key={b.label} block={b} />
        ))}
      </div>

      {/* The run of day belongs inside the finale-day section rather than
          as a section of its own — it is the answer to "what happens on
          the 19th", not a separate topic. */}
      {section.id === "day" ? <RunOfDay rows={data.runOfDay} /> : null}
    </section>
  );
}

/* overflow-x-auto is kept as a safety net, but the table carries no
   min-width: a 420px floor made the whole run of day scroll sideways on
   every phone narrower than a Pro Max, and this is the one table a team
   checks on the morning of the 19th. The time column is nowrap and the
   description wraps, so it fits 320px unaided. */
function RunOfDay({ rows }: { rows: HubData["runOfDay"] }) {
  return (
    <div className="mt-10 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <tbody>
          {rows.map((r) => (
            <tr key={r.time} className="border-t border-ink/10">
              <th
                scope="row"
                className={
                  "whitespace-nowrap py-3 pr-4 align-top font-mono text-[11px] font-normal uppercase tracking-[0.1em] sm:pr-6 " +
                  (r.flag ? "text-gold" : "text-ink/45")
                }
              >
                {r.time}
              </th>
              <td
                className={
                  "py-3 text-sm leading-snug " +
                  (r.flag ? "font-semibold text-ink" : "text-ink/70")
                }
              >
                {r.what}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="border-t border-ink/15 pt-7">
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
        {block.label}
      </h4>
      {block.kind === "text" ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/75">
          {block.body}
        </p>
      ) : (
        <ul className="mt-3 max-w-2xl space-y-2.5 border-l-2 border-gold pl-5">
          {block.items.map((item) => (
            <li key={item} className="text-base leading-relaxed text-ink/75">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
