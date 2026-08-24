/* POST /api/logout — clears the session cookie. */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/* .js extension required — see the note in hub.ts. */
import { clearCookie } from "./_session.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", clearCookie());
  return res.status(200).json({ ok: true });
}
