export type Track = "build" | "pitch";
export type JudgeTracks = "build" | "pitch" | "both" | "off";
export type Judge = { id: string; name: string; tracks: JudgeTracks };
export type JudgingConfig = {
  judges: Judge[];
  minPerTeam: number;
  assignments: Record<string, string[]>; // teamKey -> judgeIds
  excluded: string[]; // teamKeys Michael dropped after a gate failure
  closed: boolean;
  publishedAt?: string;
};
export type Gates = { linkOpens: boolean; videoUnderThree: boolean; oneSubmission: boolean; startedAfterUnlock: boolean };
export type Score = {
  judgeId: string;
  teamKey: string;
  track: Track;
  gates: Gates;
  recused: boolean;
  lines: [number, number, number, number] | null;
  total: number | null;
  comment: string;
  /* The stamp the judge page put on this payload when it built it. It
     is an opaque label, not a clock anyone compares: the device that
     sent it matches an acknowledgement to its own pending save on this
     exact string, and the server stores and echoes it untouched.
     Nothing decides a race on it, because two devices do not share a
     clock; the server takes whatever arrives last (api/scores.ts) and
     savedAt is that arrival. Optional in this type only because scores
     written before 2026-09-15, and the rehearsal fixtures, do not carry
     one; the judge page always sends it. Read it through stampOf in
     useScores. */
  clientSavedAt?: string;
  savedAt: string;
};
export const GATE_LABELS: Record<keyof Gates, string> = {
  linkOpens: "The link opens without a login or an install.",
  videoUnderThree: "The video is three minutes or less.",
  oneSubmission: "One submission from this team, in one track.",
  startedAfterUnlock: "The work started after the prompts unlocked.",
};

export function judgeId(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function scoreTotal(lines: Score["lines"]): number | null {
  return lines ? lines.reduce((a, b) => a + b, 0) : null;
}

export type Embed = { kind: "youtube" | "vimeo" | "drive" | "loom"; src: string };
