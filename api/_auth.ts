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
/* Reads that carry student work: the judges see them with the judge token
   in their link, Michael with the upload key. Either one opens the door;
   neither one leaves it open. */
export function requireAnyKey(req: VercelRequest, res: VercelResponse): boolean {
  const upload = process.env.UPLOAD_KEY?.trim();
  const judge = process.env.JUDGE_KEY?.trim();
  if (!upload && !judge) { res.status(503).json({ error: "Neither UPLOAD_KEY nor JUDGE_KEY is configured." }); return false; }
  if (judge && header(req, "x-judge-key") === judge) return true;
  if (upload && header(req, "x-upload-key") === upload) return true;
  res.status(401).json({ error: "Not allowed." });
  return false;
}
export function noStore(res: VercelResponse): void {
  res.setHeader("Cache-Control", "no-store, private");
}
