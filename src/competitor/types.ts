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
  | { kind: "videos"; label: string; items: { id: string; title: string }[] };

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

export type ResultEntry = {
  team: string;
  prompt: string;
  line: string;
  demo?: string;
  video?: string;
};

export type TrackResult = {
  track: "build" | "pitch";
  winner: ResultEntry;
  second: ResultEntry;
  finalists: string[];
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
  results: Results;
  contactEmail: string;
};
