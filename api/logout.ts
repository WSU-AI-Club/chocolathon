/* POST /api/logout — clears the session cookie. */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { clearCookie } from "./_session";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", clearCookie());
  return res.status(200).json({ ok: true });
}
