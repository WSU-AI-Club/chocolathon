/* Shapes returned by /api/hub.

   Deliberately a mirror of `api/_content.ts` rather than an import from
   it. Importing the server file into `src/` would pull every prompt into
   the browser bundle and quietly undo the release clock. Keep the two
   in sync by hand; it is a handful of types. */

export type Block =
  | { kind: "text"; label: string; body: string }
  | { kind: "list"; label: string; items: string[] }
  /* Ordered, for instructions a reader follows in sequence. */
  | { kind: "steps"; label: string; items: string[] }
  /* Outbound links rendered as real anchors, never bare URLs. */
  | { kind: "links"; label: string; items: { text: string; href: string }[] }
  /* YouTube embeds by video id, privacy-enhanced domain. */
  | { kind: "videos"; label: string; items: { id: string; title: string }[] }
  /* Question and answer pairs; the question is set bold so a phone
     reader can find theirs without reading every line. */
  | { kind: "qa"; label: string; items: { q: string; a: string }[] }
  /* A warning the reader must not miss, set bold in a ruled box. Money
     and deadlines only. */
  | { kind: "alert"; label: string; body: string }
  /* A scoring rubric: criteria with what a 1, a 5, and a 10 look like.
     Rendered by RubricView on HQ and on the judge page. */
  | {
      kind: "rubric";
      label: string;
      items: { name: string; low: string; mid: string; high: string }[];
    };

export type Prompt = {
  id: string;
  track: "build" | "pitch";
  title: string;
  teaser: string;
  wildcard?: boolean;
  blocks: Block[];
};

export type Section = {
  id: string;
  nav: string;
  title: string;
  intro?: string;
  blocks: Block[];
};

export type Person = {
  name: string;
  role: string;
  note?: string;
  linkedin?: string;
  photo?: string;
  session?: { time: string; title: string };
};

export type People = {
  speakers: Person[];
  preliminary: Person[];
  preliminaryNote?: string;
  finals: Person[];
  finalsNote?: string;
};

export type ResultEntry = {
  team: string;
  prompt: string;
  line: string;
  demo?: string;
  video?: string;
  /* What the place took home (2026-09-20). `prize` is the headline —
     the scholarship amount — and `prizeNote` the rest of it. */
  prize?: string;
  prizeNote?: string;
};

export type TrackResult = {
  track: "build" | "pitch";
  winner: ResultEntry;
  second: ResultEntry;
  third: ResultEntry;
  finalists: string[];
};

/* One row of the public submissions list (/api/gallery, 2026-09-19):
   the team's own public fields and nothing about who submitted. */
export type GalleryEntry = {
  team: string;
  track: "build" | "pitch";
  prompt: string;
  sentence: string;
  product?: string;
  video?: string;
  repo?: string;
};

export type Results = {
  published: boolean;
  intro: string;
  tracks: TrackResult[];
};

export type HubData = {
  promptsUnlocked: boolean;
  releaseAt: string;
  promptsIntro: string;
  prompts: Prompt[];
  sections: Section[];
  runOfDay: { time: string; what: string; who?: string; flag?: boolean }[];
  people: People;
  results: Results;
  contactEmail: string;
};
