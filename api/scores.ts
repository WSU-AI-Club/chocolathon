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
type Score = { judgeId: string; teamKey: string; track: "build" | "pitch"; gates: Gates; recused: boolean; lines: [number, number, number, number] | null; total: number | null; comment: string; savedAt: string };
type Submission = { teamKey: string; track: "build" | "pitch"; duplicateOf?: number };
type Judging = { submissions: Submission[] };

const GATES = ["linkOpens", "videoUnderThree", "oneSubmission", "startedAfterUnlock"] as const;
const MIN_COMMENT = 20;

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
  const lines = (s.recused || gateFailed ? null : (s.lines as [number, number, number, number]));
  return { judgeId: s.judgeId, teamKey: s.teamKey, track: sub.track, gates: s.gates as Gates, recused: s.recused, lines, total: lines ? lines.reduce((a, b) => a + b, 0) : null, comment, savedAt: new Date().toISOString() };
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
