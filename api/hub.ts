/* GET /api/hub — everything Competition HQ renders.

   This endpoint is the reason the countdown is real. The prompt text is
   assembled here, in the function, and only leaves the server when the
   release clock has passed (or PROMPTS_UNLOCKED=true for a preview).

   Before that instant the response carries no prompt text at all — not
   even the titles. The page is public (the team-code gate was dropped on
   2026-09-06); what it shows before midnight on September 14 is the
   briefing and a countdown where the prompts will be.

   Cache-Control is no-store on purpose: a CDN copy of the pre-release
   payload would keep serving "locked" after the clock turned over, and a
   copy of the post-release payload is one cache-key collision from
   appearing early. */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/* The .js extensions below are REQUIRED, not a typo, and the same goes
   for every relative import under api/. package.json sets
   "type": "module", so these functions run under Node's ESM loader in
   production, which does not do extensionless resolution. `vercel dev`
   IS lenient about it and runs fine without them, so this only shows up
   once deployed — as ERR_MODULE_NOT_FOUND on every single request.
   The extension names the compiled output; the source stays .ts. */

import {
  CONTACT_EMAIL,
  PROMPTS,
  PROMPTS_INTRO,
  RESULTS,
  RUN_OF_DAY,
  SECTIONS,
} from "./_content.js";
import { promptsUnlocked, releaseAt } from "./_release.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, private");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const unlocked = promptsUnlocked();

  return res.status(200).json({
    promptsUnlocked: unlocked,
    releaseAt: releaseAt().toISOString(),
    promptsIntro: PROMPTS_INTRO,
    /* The single most important line in this file: no prompts unless
       unlocked. Not stubs, not titles — an empty array. */
    prompts: unlocked ? PROMPTS : [],
    sections: SECTIONS,
    runOfDay: RUN_OF_DAY,
    results: RESULTS,
    contactEmail: CONTACT_EMAIL,
  });
}
