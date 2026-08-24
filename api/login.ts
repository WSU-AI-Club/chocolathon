/* POST /api/login  { code }  →  sets the session cookie.

   The whole gate is here. There is no username: the code IS the
   credential, and the team name (if the code list carries one) is
   only used to greet them. */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/* .js extension required — see the note in hub.ts. Node's ESM loader in
   production does no extensionless resolution; `vercel dev` hides it. */
import { loadTeams, matchTeam, mintCookie } from "./_session.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const teams = loadTeams();
  if (!teams || teams.length === 0) {
    /* Production with no code list configured. Fail closed and say so
       plainly — a silent pass-through would open the prompts to the
       whole internet. */
    return res.status(503).json({
      error:
        "The competitor area is not configured yet. Email aiclub@wichita.edu.",
    });
  }

  const body =
    typeof req.body === "string" ? safeParse(req.body) : (req.body ?? {});
  const code = typeof body?.code === "string" ? body.code : "";

  if (!code.trim()) {
    return res.status(400).json({ error: "Enter your team code." });
  }

  const team = matchTeam(code, teams);
  if (!team) {
    return res
      .status(401)
      .json({ error: "That code isn’t right. Check the email we sent you." });
  }

  try {
    res.setHeader("Set-Cookie", mintCookie(team));
  } catch {
    return res.status(503).json({
      error:
        "The competitor area is not configured yet. Email aiclub@wichita.edu.",
    });
  }

  return res.status(200).json({ ok: true, team: team.name });
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
