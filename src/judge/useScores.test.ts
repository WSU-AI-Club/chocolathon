import { describe, expect, it } from "vitest";
import { draftKey, mergeScores, nextPending, shouldRetry, stampOf } from "./useScores";
import type { Score } from "../judging/types";

const ok = { linkOpens: true, videoUnderThree: true, oneSubmission: true, startedAfterUnlock: true };
const s = (teamKey: string, at: string, total = 20, over: Partial<Score> = {}): Score => ({
  judgeId: "g", teamKey, track: "build", gates: ok, recused: false, lines: [5, 5, 5, 5], total,
  comment: "Twenty characters here.", clientSavedAt: at, savedAt: at, ...over,
});

describe("useScores helpers", () => {
  it("draftKey", () => { expect(draftKey("grant-johnson", "build/alpha")).toBe("choco-draft:grant-johnson:build/alpha"); });
  it("mergeScores lets a newer draft win", () => {
    const merged = mergeScores([s("build/a", "2026-09-19T19:00:00Z", 20), s("build/b", "2026-09-19T19:00:00Z")], [s("build/a", "2026-09-19T19:05:00Z", 24), s("build/c", "2026-09-19T19:01:00Z")]);
    expect(merged["build/a"].total).toBe(24);
    expect(merged["build/b"].total).toBe(20);
    expect(merged["build/c"]).toBeDefined();
  });
  it("mergeScores keeps the server copy when it is newer", () => {
    const merged = mergeScores([s("build/a", "2026-09-19T19:10:00Z", 20)], [s("build/a", "2026-09-19T19:05:00Z", 24)]);
    expect(merged["build/a"].total).toBe(20);
  });
  /* The server clock is not the judge's clock. A save typed at 19:05 and
     posted at 19:20 because the wifi was out carries savedAt 19:20, so
     savedAt would make a stale retry beat a later draft. */
  it("mergeScores compares clientSavedAt, not savedAt", () => {
    const server = s("build/a", "2026-09-19T19:00:00Z", 20, { savedAt: "2026-09-19T19:30:00Z" });
    const draft = s("build/a", "2026-09-19T19:05:00Z", 24, { savedAt: "2026-09-19T19:05:00Z" });
    expect(mergeScores([server], [draft])["build/a"].total).toBe(24);
  });
  /* A draft written by the build before clientSavedAt existed must not
     silently lose to the server: it is a judge's unsent work. */
  it("stampOf falls back to savedAt for a score written before clientSavedAt existed", () => {
    const old = { ...s("build/a", "2026-09-19T19:05:00Z", 24), clientSavedAt: undefined } as Score;
    expect(stampOf(old)).toBe("2026-09-19T19:05:00Z");
    expect(mergeScores([s("build/a", "2026-09-19T19:00:00Z", 20)], [old])["build/a"].total).toBe(24);
  });
  it("shouldRetry", () => {
    expect([null, 0, 500, 502, 408, 409, 429].map(shouldRetry)).toEqual([true, true, true, true, true, true, true]);
    expect([200, 400, 401, 404, 423].map(shouldRetry)).toEqual([false, false, false, false, false]);
  });
});

describe("nextPending", () => {
  const v1 = s("build/a", "2026-09-19T19:00:00.000Z", 20);
  const v2 = s("build/a", "2026-09-19T19:05:00.000Z", 24);

  it("is done when the acknowledged save is the one still pending", () => {
    expect(nextPending(v1, { ...v1, savedAt: "2026-09-19T19:00:04.000Z" })).toBeNull();
  });
  /* The whole point: v2 was typed while v1 was in the air. A 200 for v1
     must not clear the draft or stop the timer. */
  it("asks for another post when a newer save is pending", () => {
    expect(nextPending(v2, { ...v1, savedAt: "2026-09-19T19:04:00.000Z" })).toBe(v2);
  });
  it("is done when the server answers with something newer still", () => {
    const fromAnotherDevice = s("build/a", "2026-09-19T19:09:00.000Z", 31);
    expect(nextPending(v2, fromAnotherDevice)).toBeNull();
  });
  it("is done when nothing is pending", () => {
    expect(nextPending(undefined, v1)).toBeNull();
  });
  it("still owes the pending save when nothing was acknowledged", () => {
    expect(nextPending(v2, null)).toBe(v2);
  });
  /* A deploy that does not echo clientSavedAt would otherwise loop. */
  it("treats a server that does not echo clientSavedAt as an acknowledgement", () => {
    expect(nextPending(v2, { ...v1, clientSavedAt: undefined } as Score)).toBeNull();
  });
});

/* ── the review's scenario, end to end over the helpers ──────────────
   The rig is the hook's retry loop with the network and the blob store
   replaced: every save writes the draft and overwrites pending, the
   timer posts whatever pending holds at fire time, and the fake server
   applies the same last-write-wins rule as api/scores.ts. */
function rig() {
  const pending: Record<string, Score> = {};
  const drafts: Record<string, Score> = {};
  const store: Record<string, Score> = {};
  let online = false;
  let clock = 0;

  const post = (body: Score): { stale?: boolean; score: Score } | null => {
    if (!online) return null; // fetch rejects, status null, shouldRetry says keep it
    const existing = store[body.teamKey];
    if (existing && Date.parse(stampOf(existing)) > Date.parse(stampOf(body))) return { stale: true, score: existing };
    clock += 1;
    store[body.teamKey] = { ...body, savedAt: `2026-09-19T20:00:0${clock}.000Z` };
    return { score: store[body.teamKey] };
  };

  const attempt = (teamKey: string): void => {
    const score = pending[teamKey];
    if (!score) return;
    const res = post(score);
    if (!res) return; // offline: the draft and the timer both stay
    if (nextPending(pending[teamKey], res.score)) { attempt(teamKey); return; }
    delete pending[teamKey];
    delete drafts[teamKey];
  };

  return {
    pending, drafts, store,
    connect: (v: boolean) => { online = v; },
    save: (score: Score) => { drafts[score.teamKey] = score; pending[score.teamKey] = score; attempt(score.teamKey); },
    tick: () => { for (const key of Object.keys(pending)) attempt(key); },
  };
}

describe("two offline saves, then the network comes back", () => {
  it("ends with v2 on the server and clears the draft only once v2 is acknowledged", () => {
    const r = rig();
    const v1 = s("build/a", "2026-09-19T19:00:00.000Z", 20, { comment: "First pass at the feedback." });
    const v2 = s("build/a", "2026-09-19T19:05:00.000Z", 32, { comment: "Corrected: the demo does work.", lines: [8, 8, 8, 8] });

    r.save(v1);
    expect(r.store["build/a"]).toBeUndefined();
    expect(r.drafts["build/a"].total).toBe(20);

    r.save(v2);
    expect(r.store["build/a"]).toBeUndefined();
    expect(r.pending["build/a"].total).toBe(32); // v2 replaced v1 in pending
    expect(r.drafts["build/a"].total).toBe(32);

    r.connect(true);
    r.tick();

    expect(r.store["build/a"].total).toBe(32);
    expect(r.store["build/a"].comment).toBe("Corrected: the demo does work.");
    expect(r.store["build/a"].clientSavedAt).toBe("2026-09-19T19:05:00.000Z");
    expect(r.drafts["build/a"]).toBeUndefined();
    expect(r.pending["build/a"]).toBeUndefined();
  });

  it("keeps saving normally once the network is back", () => {
    const r = rig();
    r.connect(true);
    const v3 = s("build/a", "2026-09-19T19:20:00.000Z", 28);
    r.save(v3);
    expect(r.store["build/a"].total).toBe(28);
    expect(r.drafts["build/a"]).toBeUndefined();
  });

  it("adopts the server copy and clears the draft when the server refuses as stale", () => {
    const r = rig();
    r.connect(true);
    r.save(s("build/a", "2026-09-19T19:30:00.000Z", 36)); // another device got there first
    r.connect(false);
    const late = s("build/a", "2026-09-19T19:10:00.000Z", 12);
    r.save(late);
    r.connect(true);
    r.tick();
    expect(r.store["build/a"].total).toBe(36);
    expect(r.drafts["build/a"]).toBeUndefined();
  });
});
