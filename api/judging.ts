/* /api/judging — the submissions the judge page shows.

   GET   returns the latest published set as JSON (404 if none yet).
   POST  replaces it. Body: the JSON the upload page produced. Header
         x-upload-key must equal UPLOAD_KEY, or the request is refused.

   Storage is a private Vercel Blob store connected to this project
   (chocolathon-judging), one fixed pathname overwritten on each upload.
   BLOB_READ_WRITE_TOKEN is injected by Vercel; UPLOAD_KEY is set by hand.
   Private store: the blob has no public URL, so the only way to read it
   is through this function, which sets no-store so nothing caches it.

   The .js extension on the relative import is REQUIRED (ESM loader in
   production; see hub.ts). */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { get, put } from "@vercel/blob";

const PATHNAME = "judging/submissions.json";
const MAX_BYTES = 2_000_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, private");

  if (req.method === "GET") {
    try {
      const found = await get(PATHNAME, { access: "private", useCache: false });
      if (!found || !found.stream) return res.status(404).json({ error: "No submissions published yet." });
      const text = await new Response(found.stream).text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : "read failed";
      /* A store with nothing in it reads as not-found, not as an error. */
      if (/not.?found/i.test(message)) return res.status(404).json({ error: "No submissions published yet." });
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === "POST") {
    const expected = process.env.UPLOAD_KEY?.trim();
    const given = String(req.headers["x-upload-key"] ?? "").trim();
    if (!expected) return res.status(503).json({ error: "UPLOAD_KEY is not configured." });
    if (!given || given !== expected) return res.status(401).json({ error: "Wrong upload key." });

    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    if (body.length > MAX_BYTES) return res.status(413).json({ error: "Too large." });
    let parsed: { submissions?: unknown[] };
    try {
      parsed = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Body is not JSON." });
    }
    if (!Array.isArray(parsed.submissions)) return res.status(400).json({ error: "Missing submissions[]." });

    const stored = JSON.stringify({ ...parsed, publishedAt: new Date().toISOString() });
    await put(PATHNAME, stored, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return res.status(200).json({ ok: true, count: parsed.submissions.length });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
