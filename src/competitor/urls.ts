/* Turn what a team typed into a link field into something a browser
   can open (2026-09-19, after judging). The form did not validate, so
   the stored values include a bare domain ("cocoa-dolce.lovable.app"),
   a scheme-less video ("youtube.com/watch?v=…"), and prose with one
   or more links inside ("Camera App: https://a.app Admin: https://b.app").
   Rendered as-is in an href, a bare domain resolves as a path under our
   own site, which is what judges saw on the day: our domain with theirs
   appended. The judge card, the video embed, and the public gallery all
   go through here. */

const ABSOLUTE = /https?:\/\/[^\s|,<>"')]+/gi;
const BARE_DOMAIN = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/i;

/* Every absolute URL in the text, in order, with trailing punctuation
   trimmed. A bare domain on its own counts as one https URL. */
export function urlsIn(raw: string | undefined | null): string[] {
  const text = (raw ?? "").trim();
  if (!text) return [];
  const found = (text.match(ABSOLUTE) ?? []).map((u) => u.replace(/[.,;:)]+$/, ""));
  if (found.length) return found;
  if (BARE_DOMAIN.test(text)) return [`https://${text}`];
  return [];
}

/* The one link to open for a field, or undefined when there is none. */
export function toHref(raw: string | undefined | null): string | undefined {
  return urlsIn(raw)[0];
}
