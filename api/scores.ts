/* /api/scores: one private blob per judge per team.
   GET ?judge=<id>   judge token   that judge's scores
   GET ?all=1        upload key    every score (ranking, export)
   POST              judge token   save one score; refused once judging is closed
   DELETE            upload key    wipe every score (rehearsal reset) */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PATHS, deleteAll, readAll, readJson, writeJson } from "./_blob.js";
import { noStore, requireJudgeKey, requireUploadKey } from "./_auth.js";
import type { JudgingConfig } from "./judging-config.js";

type Gates = { linkOpens: boolean; videoUnderThree: boolean; oneSubmission: boolean; startedAfterUnlock: boolean };
/* clientSavedAt is an opaque echo. The judge page stamps it when it
   builds a payload and matches an acknowledgement to its own pending
   save by comparing this exact string, so this file stores it and
   returns it byte for byte and never compares it with anything. It is a
   device clock, and a phone that is seven minutes fast would otherwise
   beat a later correction from a laptop. savedAt is this server's clock
   at the moment the write landed, which is the only clock every device
   shares. Keep in step with src/judging/types.ts. */
type Score = { judgeId: string; teamKey: string; track: "build" | "pitch"; gates: Gates; recused: boolean; lines: [number, number, number, number] | null; total: number | null; comment: string; clientSavedAt: string; savedAt: string };
type Submission = { teamKey: string; track: "build" | "pitch"; duplicateOf?: number };
type Judging = { submissions: Submission[] };

const GATES = ["linkOpens", "videoUnderThree", "oneSubmission", "startedAfterUnlock"] as const;
const MIN_COMMENT = 20;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/* Checked for shape and length so nothing absurd is stored, then handed
   back exactly as it arrived: the client matches its acknowledgement on
   the string, so normalising it here would break that match. A judge
   whose bundle predates the field gets this server's clock, which is
   what the old build did; refusing them would cost a real score on the
   day for nothing. */
function clientStamp(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return new Date().toISOString();
  if (typeof raw !== "string" || raw.length > 40 || !ISO.test(raw)) return null;
  if (Number.isNaN(Date.parse(raw))) return null;
  return raw;
}

function validate(x: unknown, config: JudgingConfig, judging: Judging): Score | string {
  if (!x || typeof x !== "object") return "Body is not an object.";
  const s = x as Partial<Score>;
  if (typeof s.judgeId !== "string" || !config.judges.some((j) => j.id === s.judgeId)) return "Unknown judge.";
  if (typeof s.teamKey !== "string") return "Missing teamKey.";
  const sub = judging.submissions.find((t) => t.teamKey === s.teamKey && !t.duplicateOf);
  if (!sub) return "Unknown team.";
  if (s.track !== sub.track) return "Track does not match the submission.";
  if (!s.gates || typeof s.gates !== "object" || GATES.some((g) => typeof (s.gates as Gates)[g] !== "boolean")) return "gates is malformed.";
  if (typeof s.recused !== "boolean") return "recused must be true or false.";
  const gateFailed = GATES.some((g) => !(s.gates as Gates)[g]);
  if (s.recused || gateFailed) {
    if (s.lines !== null && s.lines !== undefined) return s.recused ? "A recusal carries no lines." : "A failed gate carries no lines.";
  } else {
    if (!Array.isArray(s.lines) || s.lines.length !== 4 || s.lines.some((n) => !Number.isInteger(n) || n < 1 || n > 10)) return "lines must be four whole numbers from 1 to 10.";
  }
  const comment = typeof s.comment === "string" ? s.comment.trim() : "";
  if (!s.recused && comment.length < MIN_COMMENT) return `The comment needs at least ${MIN_COMMENT} characters. The team will read it.`;
  const clientSavedAt = clientStamp((s as { clientSavedAt?: unknown }).clientSavedAt);
  if (!clientSavedAt) return "clientSavedAt must be an ISO date.";
  const lines = (s.recused || gateFailed ? null : (s.lines as [number, number, number, number]));
  return { judgeId: s.judgeId, teamKey: s.teamKey, track: sub.track, gates: s.gates as Gates, recused: s.recused, lines, total: lines ? lines.reduce((a, b) => a + b, 0) : null, comment, clientSavedAt, savedAt: new Date().toISOString() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  try {
    if (req.method === "GET") {
      const all = String(req.query.all ?? "") === "1";
      if (all) {
        if (!requireUploadKey(req, res)) return;
        return res.status(200).json({ scores: await readAll<Score>(PATHS.scores) });
      }
      if (!requireJudgeKey(req, res)) return;
      const judge = String(req.query.judge ?? "").trim();
      if (!/^[a-z0-9-]{1,60}$/.test(judge)) return res.status(400).json({ error: "Missing judge." });
      return res.status(200).json({ scores: await readAll<Score>(`${PATHS.scores}${judge}/`) });
    }
    if (req.method === "POST") {
      if (!requireJudgeKey(req, res)) return;
      const [config, judging] = await Promise.all([readJson<JudgingConfig>(PATHS.config), readJson<Judging>(PATHS.submissions)]);
      if (!config || !judging) return res.status(409).json({ error: "Nothing published to score yet." });
      if (config.closed) return res.status(423).json({ error: "Judging is closed." });
      let body: unknown;
      try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: "Body is not JSON." }); }
      const score = validate(body, config, judging);
      if (typeof score === "string") return res.status(400).json({ error: score });
      /* Arrival order is truth: the score that gets here last is the one
         this server holds. Device clocks disagree by minutes, so
         deciding the race on clientSavedAt threw away real corrections
         (a phone running fast beat a later fix from a laptop, and the
         page then adopted the old copy under Saved). One device never
         posts an older payload after a newer one, because the judge page
         keeps one pending save per team and posts whatever that holds at
         the moment it fires, so the only thing this rule can reorder is
         two devices, where the later arrival is the later decision. */
      await writeJson(PATHS.score(score.judgeId, score.teamKey), score);
      return res.status(200).json({ ok: true, score });
    }
    if (req.method === "DELETE") {
      if (!requireUploadKey(req, res)) return;
      const deleted = await deleteAll(PATHS.scores);
      return res.status(200).json({ ok: true, deleted });
    }
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "failed" });
  }
}
