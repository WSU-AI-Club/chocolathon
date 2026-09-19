/* The eight portraits, shared by the landing page's team section and
   the /team page so the two never drift. Four across on a desktop,
   two on a phone; each entry is a portrait over a name, the role, and
   the links. Same 256px circle assets and hairline ring as the people
   page, drawn larger here because the portrait is the point. The
   LinkedIn mark is the link (44px target, labelled); a member with a
   site gets one more text link beside it. The links row is pinned to
   the bottom of each cell so a two-line title never pushes it out of
   line with its neighbours. */

import { LinkedInIcon } from "./icons";
import { TEAM, type TeamMember } from "./team";

export default function TeamGrid({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12 md:grid-cols-4 ${className}`}
    >
      {TEAM.map((m) => (
        <li key={m.name} className="flex flex-col items-center text-center">
          <Member member={m} />
        </li>
      ))}
    </ul>
  );
}

function Member({ member }: { member: TeamMember }) {
  return (
    <>
      <img
        src={member.photo}
        alt=""
        width={128}
        height={128}
        loading="lazy"
        className="h-24 w-24 rounded-full object-cover ring-1 ring-ink/10 sm:h-32 sm:w-32"
      />
      <p className="mt-4 text-lg font-semibold leading-snug text-ink">{member.name}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink/80 sm:text-base">{member.role}</p>
      {/* mt-auto: the grid stretches every cell in a row to the tallest,
          so the link row sits on one line across the row even when a
          title wraps. Never padded by hand. */}
      <p className="mt-auto flex items-center justify-center gap-1 pt-1">
        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} on LinkedIn`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm transition-opacity hover:opacity-70"
        >
          <LinkedInIcon className="h-5 w-5" />
        </a>
        {member.site ? (
          <a
            href={member.site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center text-sm text-ink underline decoration-gold underline-offset-4 hover:decoration-ink"
          >
            {member.site.label}
          </a>
        ) : null}
      </p>
    </>
  );
}
