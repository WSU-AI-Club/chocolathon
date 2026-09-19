/* /api/gallery - every submission, for the public results page.

   GET returns the teams' own public fields from the published judging
   set: team, track, prompt, the one sentence, and the project, video,
   and source links. Nothing else leaves: no submitter name, no email,
   no "click first" or notes. It answers with an empty list until
   RESULTS.published is flipped in _content.ts, so the list appears the
   same moment the winners do, and it never serves the rehearsal set
   (`sample: true`). Duplicates (a team's earlier submission) and teams
   Michael excluded on the upload page are left out.

   The .js extensions on the relative imports are REQUIRED (ESM loader
   in production; see hub.ts). */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PATHS, readJson } from "./_blob.js";
import { RESULTS } from "./_content.js";

type StoredSubmission = {
  team: string;
  teamKey: string;
  track: "build" | "pitch";
  prompt: string;
  sentence: string;
  product: string;
  video: string;
  repo: string;
  duplicateOf?: number;
};
type StoredJudging = { sample?: boolean; submissions?: StoredSubmission[] };
type StoredConfig = { excluded?: string[] };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!RESULTS.published) return res.status(200).json({ published: false, entries: [] });

  try {
    const [judging, config] = await Promise.all([
      readJson<StoredJudging>(PATHS.submissions),
      readJson<StoredConfig>(PATHS.config),
    ]);
    if (!judging || judging.sample) return res.status(200).json({ published: true, entries: [] });
    const excluded = new Set(config?.excluded ?? []);
    const entries = (judging.submissions ?? [])
      .filter((s) => s.duplicateOf === undefined && !excluded.has(s.teamKey))
      .map((s) => ({
        team: s.team,
        track: s.track,
        prompt: s.prompt,
        sentence: s.sentence,
        product: s.product || undefined,
        video: s.video || undefined,
        repo: s.repo || undefined,
      }))
      .sort((a, b) => a.team.localeCompare(b.team));
    return res.status(200).json({ published: true, entries });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "read failed" });
  }
}
