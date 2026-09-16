import type { VercelRequest, VercelResponse } from "@vercel/node";

function header(req: VercelRequest, name: string): string {
  return String(req.headers[name] ?? "").trim();
}
/* Returns true when allowed; otherwise writes the refusal and returns false. */
export function requireUploadKey(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.UPLOAD_KEY?.trim();
  if (!expected) { res.status(503).json({ error: "UPLOAD_KEY is not configured." }); return false; }
  if (header(req, "x-upload-key") !== expected) { res.status(401).json({ error: "Wrong upload key." }); return false; }
  return true;
}
export function requireJudgeKey(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.JUDGE_KEY?.trim();
  if (!expected) { res.status(503).json({ error: "JUDGE_KEY is not configured." }); return false; }
  if (header(req, "x-judge-key") !== expected) { res.status(401).json({ error: "This link is not valid. Ask Michael for the judge link." }); return false; }
  return true;
}
export function noStore(res: VercelResponse): void {
  res.setHeader("Cache-Control", "no-store, private");
}
