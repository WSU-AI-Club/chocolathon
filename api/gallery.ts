/* /api/gallery - every submission, for the public results page.

   GET returns the teams' own public fields: team, track, prompt, the
   one sentence, and the project, video, and source links. Nothing else
   leaves: no submitter name, no email, no "click first" or notes. It
   answers with an empty list until RESULTS.published is flipped in
   _content.ts, so the list appears the same moment the winners do.

   Since 2026-09-20 the rows come from _gallery.ts, in the repo, and not
   from the private judging blob. That store began answering 403 to
   every read the day after the event and took the gallery down with it
   (the judge and ranking pages too). The competition is over and these
   rows are final, so the public half of that set now lives where
   nothing can revoke it. Duplicates were already dropped and no team
   was excluded.

   The .js extensions on the relative imports are REQUIRED (ESM loader
   in production; see hub.ts). */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { RESULTS } from "./_content.js";
import { GALLERY } from "./_gallery.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!RESULTS.published) return res.status(200).json({ published: false, entries: [] });
  return res.status(200).json({ published: true, entries: GALLERY });
}
