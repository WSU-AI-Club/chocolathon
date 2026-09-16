/* Private Vercel Blob helpers shared by the judging functions. The store
   is chocolathon-judging; BLOB_READ_WRITE_TOKEN is injected by Vercel.
   The .js extensions on imports of this file are REQUIRED (ESM loader). */
import { del, get, list, put } from "@vercel/blob";

export async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const found = await get(pathname, { access: "private", useCache: false });
    if (!found || !found.stream) return null;
    return JSON.parse(await new Response(found.stream).text()) as T;
  } catch (err) {
    if (/not.?found/i.test(err instanceof Error ? err.message : "")) return null;
    throw err;
  }
}

export async function writeJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
}

export async function listPaths(prefix: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: 1000, cursor });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export async function readAll<T>(prefix: string): Promise<T[]> {
  const paths = await listPaths(prefix);
  const results = await Promise.all(paths.map((p) => readJson<T>(p)));
  return results.filter((x: T | null): x is T => x !== null);
}

export async function deleteAll(prefix: string): Promise<number> {
  const paths = await listPaths(prefix);
  if (paths.length) await del(paths);
  return paths.length;
}

export const PATHS = {
  submissions: "judging/submissions.json",
  config: "judging/config.json",
  scores: "judging/scores/",
  score: (judgeId: string, teamKey: string) => `judging/scores/${judgeId}/${teamKey.replace("/", "__")}.json`,
};
