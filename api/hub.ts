/* GET /api/hub — everything the competitor area renders.

   This endpoint is the reason the gate is real. The prompt text is
   assembled here, in the function, and only leaves the server when
   BOTH conditions hold:

     1. a valid session cookie (or HUB_PUBLIC=true, after the event)
     2. the release clock has passed (or PROMPTS_UNLOCKED=true)

   Logged out, the response carries no prompt text at all — not even
   the titles. Before September 14, a logged-in team gets the full
   briefing and a countdown where the prompts will be.

   Cache-Control is no-store on purpose: a CDN copy of a gated payload
   is a leak waiting for a cache key collision. */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  CONTACT_EMAIL,
  KEY_DATES,
  PROMPTS,
  RUN_OF_DAY,
  SECTIONS,
} from "./_content";
import { hubIsPublic, promptsUnlocked, readCookie, releaseAt } from "./_session";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, private");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const isPublic = hubIsPublic();
  const team = readCookie(req.headers.cookie);

  if (team === null && !isPublic) {
    return res.status(401).json({ authed: false });
  }

  const unlocked = promptsUnlocked();

  return res.status(200).json({
    authed: true,
    isPublic,
    team: team ?? "",
    promptsUnlocked: unlocked,
    releaseAt: releaseAt().toISOString(),
    /* The single most important line in this file: no prompts unless
       unlocked. Not stubs, not titles — an empty array. */
    prompts: unlocked ? PROMPTS : [],
    sections: SECTIONS,
    keyDates: KEY_DATES,
    runOfDay: RUN_OF_DAY,
    contactEmail: CONTACT_EMAIL,
  });
}
