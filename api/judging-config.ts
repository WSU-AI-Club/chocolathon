/* /api/judging-config: judges, assignments, excluded teams, the closed switch.

   GET needs a key. The config carries team names and who judges what, so
   it is not open: the judge page reads it with the judge token in the
   link, the upload and ranking pages with the upload key.

   POST needs the upload key and MERGES. The body may carry any subset of
   judges, minPerTeam, assignments, excluded, closed; only the fields it
   carries change, and the full merged config comes back so the caller
   can replace its copy. Before this, both of Michael's pages sent the
   whole document from whatever snapshot they had loaded, so a stale
   upload tab publishing assignments reverted the close switch and every
   exclusion the ranking page had just made.

   The .js extensions on the relative imports are REQUIRED (ESM loader in
   production; see hub.ts). */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PATHS, readJson, writeJson } from "./_blob.js";
import { noStore, requireAnyKey, requireUploadKey } from "./_auth.js";

type Judge = { id: string; name: string; tracks: "build" | "pitch" | "both" | "off" };
export type JudgingConfig = { judges: Judge[]; minPerTeam: number; assignments: Record<string, string[]>; excluded: string[]; closed: boolean; publishedAt?: string };

/* What a config is before anybody has published one. */
export const DEFAULT_CONFIG: JudgingConfig = { judges: [], minPerTeam: 2, assignments: {}, excluded: [], closed: false };

const TRACKS = new Set(["build", "pitch", "both", "off"]);

/* Validates only the fields the body actually carries. Returns the patch,
   or a sentence saying what is wrong with it. */
function validatePatch(x: unknown): Partial<JudgingConfig> | string {
  if (!x || typeof x !== "object" || Array.isArray(x)) return "Body is not an object.";
  const c = x as Record<string, unknown>;
  const patch: Partial<JudgingConfig> = {};

  if (c.judges !== undefined) {
    const judges = c.judges as Judge[];
    if (!Array.isArray(judges) || judges.some((j) => !j || typeof j.id !== "string" || !/^[a-z0-9-]{1,60}$/.test(j.id) || typeof j.name !== "string" || !j.name.trim() || !TRACKS.has(j.tracks))) return "judges is malformed.";
    if (new Set(judges.map((j) => j.id)).size !== judges.length) return "Two judges share an id.";
    patch.judges = judges;
  }
  if (c.minPerTeam !== undefined) {
    if (!Number.isInteger(c.minPerTeam) || (c.minPerTeam as number) < 1 || (c.minPerTeam as number) > 6) return "minPerTeam must be 1 to 6.";
    patch.minPerTeam = c.minPerTeam as number;
  }
  if (c.assignments !== undefined) {
    const assignments = c.assignments as Record<string, string[]>;
    if (!assignments || typeof assignments !== "object" || Array.isArray(assignments) || Object.values(assignments).some((v) => !Array.isArray(v) || v.some((id) => typeof id !== "string"))) return "assignments is malformed.";
    patch.assignments = assignments;
  }
  if (c.excluded !== undefined) {
    if (!Array.isArray(c.excluded) || (c.excluded as unknown[]).some((k) => typeof k !== "string")) return "excluded is malformed.";
    patch.excluded = c.excluded as string[];
  }
  if (c.closed !== undefined) {
    if (typeof c.closed !== "boolean") return "closed must be true or false.";
    patch.closed = c.closed;
  }
  if (Object.keys(patch).length === 0) return "Nothing to change. Send at least one of judges, minPerTeam, assignments, excluded, closed.";
  return patch;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method === "GET") {
    if (!requireAnyKey(req, res)) return;
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
    const patch = validatePatch(body);
    if (typeof patch === "string") return res.status(400).json({ error: patch });
    try {
      const current = await readJson<JudgingConfig>(PATHS.config);
      const merged: JudgingConfig = { ...DEFAULT_CONFIG, ...(current ?? {}), ...patch, publishedAt: new Date().toISOString() };
      await writeJson(PATHS.config, merged);
      return res.status(200).json(merged);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "write failed" });
    }
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
