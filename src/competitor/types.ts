/* Shapes returned by /api/hub.

   Deliberately a mirror of `api/_content.ts` rather than an import from
   it. Importing the server file into `src/` would pull every prompt into
   the browser bundle and quietly undo the release clock. Keep the two
   in sync by hand; it is four types. */

export type Block =
  | { kind: "text"; label: string; body: string }
  | { kind: "list"; label: string; items: string[] };

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

export type HubData = {
  promptsUnlocked: boolean;
  releaseAt: string;
  prompts: Prompt[];
  sections: Section[];
  keyDates: { date: string; what: string }[];
  runOfDay: { time: string; what: string; flag?: boolean }[];
  contactEmail: string;
};
