/* /api/judging-config: judges, assignments, the closed switch.
   GET is open (the judge page needs names and assignments; nothing
   secret is in it). POST needs the upload key. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PATHS, readJson, writeJson } from "./_blob.js";
import { noStore, requireUploadKey } from "./_auth.js";

type Judge = { id: string; name: string; tracks: "build" | "pitch" | "both" | "off" };
export type JudgingConfig = { judges: Judge[]; minPerTeam: number; assignments: Record<string, string[]>; excluded: string[]; closed: boolean; publishedAt?: string };

const TRACKS = new Set(["build", "pitch", "both", "off"]);
function validate(x: unknown): JudgingConfig | string {
  if (!x || typeof x !== "object") return "Body is not an object.";
  const c = x as Partial<JudgingConfig>;
  if (!Array.isArray(c.judges) || c.judges.some((j) => !j || typeof j.id !== "string" || !/^[a-z0-9-]{1,60}$/.test(j.id) || typeof j.name !== "string" || !j.name.trim() || !TRACKS.has(j.tracks))) return "judges is malformed.";
  if (new Set(c.judges.map((j) => j.id)).size !== c.judges.length) return "Two judges share an id.";
  if (!Number.isInteger(c.minPerTeam) || (c.minPerTeam as number) < 1 || (c.minPerTeam as number) > 6) return "minPerTeam must be 1 to 6.";
  if (!c.assignments || typeof c.assignments !== "object" || Object.values(c.assignments).some((v) => !Array.isArray(v) || v.some((id) => typeof id !== "string"))) return "assignments is malformed.";
  if (!Array.isArray(c.excluded) || c.excluded.some((k) => typeof k !== "string")) return "excluded is malformed.";
  if (typeof c.closed !== "boolean") return "closed must be true or false.";
  return { judges: c.judges, minPerTeam: c.minPerTeam as number, assignments: c.assignments, excluded: c.excluded, closed: c.closed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method === "GET") {
    try {
      const config = await readJson<JudgingConfig>(PATHS.config);
      if (!config) return res.status(404).json({ error: "No judging config published yet." });
      return res.status(200).json(config);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "read failed" });
    }
  }
  if (req.method === "POST") {
    if (!requireUploadKey(req, res)) return;
    let body: unknown;
    try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: "Body is not JSON." }); }
    const config = validate(body);
    if (typeof config === "string") return res.status(400).json({ error: config });
    await writeJson(PATHS.config, { ...config, publishedAt: new Date().toISOString() });
    return res.status(200).json({ ok: true });
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
