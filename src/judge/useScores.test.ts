import { describe, expect, it } from "vitest";
import {
  draftKey,
  mergeScores,
  nextPending,
  postPending,
  shouldRetry,
  stampOf,
  type PostReply,
  type SaveDeps,
  type SaveState,
} from "./useScores";
import type { Score } from "../judging/types";

const ok = { linkOpens: true, videoUnderThree: true, oneSubmission: true, startedAfterUnlock: true };
const s = (teamKey: string, at: string, total = 20, over: Partial<Score> = {}): Score => ({
  judgeId: "g", teamKey, track: "build", gates: ok, recused: false, lines: [5, 5, 5, 5], total,
  comment: "Twenty characters here.", clientSavedAt: at, savedAt: at, ...over,
});

describe("useScores helpers", () => {
  it("draftKey", () => { expect(draftKey("grant-johnson", "build/alpha")).toBe("choco-draft:grant-johnson:build/alpha"); });
  it("mergeScores takes the server copy for a team with no draft", () => {
    const merged = mergeScores([s("build/a", "2026-09-19T19:00:00Z", 20), s("build/b", "2026-09-19T19:00:00Z")], [s("build/c", "2026-09-19T19:01:00Z")]);
    expect(merged["build/a"].total).toBe(20);
    expect(merged["build/b"].total).toBe(20);
    expect(merged["build/c"]).toBeDefined();
  });
  /* A draft only survives a save that was never acknowledged, so it is
     this device's unsent work. Nothing on the server can be a later
     version of it, whatever the stamps say. */
  it("mergeScores lets a draft win even when the server stamp looks newer", () => {
    const server = s("build/a", "2026-09-19T19:10:00Z", 20);
    const draft = s("build/a", "2026-09-19T19:05:00Z", 24);
    expect(mergeScores([server], [draft])["build/a"].total).toBe(24);
  });
  /* The scenario that cost a real correction: the server copy came from
     a phone whose clock runs seven minutes fast. Comparing that stamp
     with this laptop's would hide the judge's own unsent typing. */
  it("mergeScores never compares a draft with another device's clock", () => {
    const fromFastPhone = s("build/a", "2026-09-19T19:12:00Z", 20, { savedAt: "2026-09-19T19:05:02Z" });
    const myDraft = s("build/a", "2026-09-19T19:06:00Z", 31);
    expect(mergeScores([fromFastPhone], [myDraft])["build/a"].total).toBe(31);
  });
  it("stampOf falls back to savedAt for a score written before clientSavedAt existed", () => {
    const old = { ...s("build/a", "2026-09-19T19:05:00Z", 24), clientSavedAt: undefined } as Score;
    expect(stampOf(old)).toBe("2026-09-19T19:05:00Z");
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
  /* The whole point: v2 was typed while v1 was in the air. An answer
     about v1 must not clear the draft or stop the timer. */
  it("asks for another post when a newer save is pending", () => {
    expect(nextPending(v2, { ...v1, savedAt: "2026-09-19T19:04:00.000Z" })).toBe(v2);
  });
  /* The match is on the stamp string, not on which stamp is larger. The
     server echoes what it was sent, so anything else is an answer about
     a payload this device is not waiting on, and the pending one is
     still owed. */
  it("still owes the pending save when the answer names a different payload", () => {
    const somethingElse = s("build/a", "2026-09-19T19:09:00.000Z", 31);
    expect(nextPending(v2, somethingElse)).toBe(v2);
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

/* ── the retry loop itself, with the network in the test's hands ──────
   postPending is the hook's attempt() with its refs and writers handed
   in, so these run the shipped code rather than a copy of it. */
type Reply = { status: number; body: PostReply | null } | "network";

function harness(reply: (sent: Score, n: number) => Reply | Promise<Reply>) {
  const pending: Record<string, Score> = {};
  const inFlight: Record<string, boolean> = {};
  const sent: Score[] = [];
  const cleared: string[] = [];
  const started: string[] = [];
  const stopped: string[] = [];
  const scores: Record<string, Score> = {};
  const states: SaveState["kind"][] = [];
  const chain: Promise<void>[] = [];
  let session = 1;
  let unauthorized = false;
  let refusal = "";

  const deps: SaveDeps = {
    token: "judge-token",
    session: () => session,
    pending,
    inFlight,
    fetcher: async (_input, init) => {
      const body = JSON.parse(init.body) as Score;
      sent.push(body);
      const r = await reply(body, sent.length);
      if (r === "network") throw new Error("offline");
      return { status: r.status, json: async () => r.body };
    },
    ensureTimer: (key) => { started.push(key); },
    stopTimer: (key) => { stopped.push(key); },
    clearDraft: (_judgeId, key) => { cleared.push(key); },
    setScore: (key, score) => { scores[key] = score; },
    setState: (_key, state) => {
      states.push(state.kind);
      if (state.kind === "refused") refusal = state.message;
    },
    onUnauthorized: () => { unauthorized = true; },
    again: (key) => { chain.push(postPending(deps, key)); },
  };

  return {
    deps, pending, sent, cleared, started, stopped, scores, states,
    get unauthorized() { return unauthorized; },
    get refusal() { return refusal; },
    switchJudge: () => { session += 1; },
    /* Every post the code asked for itself, to the end. */
    drain: async () => { while (chain.length) await chain.shift(); },
    run: async (teamKey: string) => {
      await postPending(deps, teamKey);
      while (chain.length) await chain.shift();
    },
  };
}

const KEY = "build/a";
const echo = (sent: Score): Reply => ({ status: 200, body: { ok: true, score: { ...sent, savedAt: "2026-09-19T20:00:01.000Z" } } });

describe("postPending: a refusal never strands a newer save", () => {
  const v1 = s(KEY, "2026-09-19T19:00:00.000Z", 20, { comment: "Too short." });
  const v2 = s(KEY, "2026-09-19T19:05:00.000Z", 32, { comment: "Long enough to be accepted." });

  it("posts the newer pending payload when the refusal is about the one it replaced", async () => {
    const h = harness((body, n) =>
      n === 1 ? { status: 400, body: { error: "The comment needs at least 20 characters." } } : echo(body),
    );
    /* v1 goes out, v2 is typed while it is in the air. */
    h.pending[KEY] = v1;
    const first = postPending(h.deps, KEY);
    h.pending[KEY] = v2;
    await first;
    await h.drain(); // the repost the refusal asked for

    expect(h.sent.map((x) => x.total)).toEqual([20, 32]);
    expect(h.states).not.toContain("refused");
    expect(h.scores[KEY].total).toBe(32);
    expect(h.cleared).toEqual([KEY]);
  });

  it("stops and shows the server's sentence when the refusal is about the latest pending save", async () => {
    const h = harness(() => ({ status: 400, body: { error: "The comment needs at least 20 characters." } }));
    h.pending[KEY] = v1;
    await h.run(KEY);

    expect(h.sent).toHaveLength(1);
    expect(h.refusal).toBe("The comment needs at least 20 characters.");
    expect(h.stopped).toEqual([KEY]);
    /* The draft is the judge's only copy of what they typed. */
    expect(h.cleared).toEqual([]);
    expect(h.pending[KEY]).toBe(v1);
  });

  it("says the token is wrong only once the 401 is about the latest save", async () => {
    const h = harness((body, n) => (n === 1 ? { status: 401, body: { error: "no" } } : echo(body)));
    h.pending[KEY] = v1;
    const first = postPending(h.deps, KEY);
    h.pending[KEY] = v2;
    await first;
    expect(h.unauthorized).toBe(false);
    await h.drain();
    expect(h.sent).toHaveLength(2);
    expect(h.unauthorized).toBe(false); // the second one landed
  });
});

describe("postPending: the draft goes only on the acknowledgement of the latest save", () => {
  const v1 = s(KEY, "2026-09-19T19:00:00.000Z", 20);
  const v2 = s(KEY, "2026-09-19T19:05:00.000Z", 32);

  it("keeps the draft and posts again when a newer save arrived mid flight", async () => {
    const h = harness((body) => echo(body));
    h.pending[KEY] = v1;
    const first = postPending(h.deps, KEY);
    h.pending[KEY] = v2;
    await first;
    expect(h.cleared).toEqual([]); // v1's 200 cleared nothing
    expect(h.stopped).toEqual([]);
    await h.drain();
    expect(h.sent.map((x) => x.total)).toEqual([20, 32]);
    expect(h.cleared).toEqual([KEY]);
    expect(h.stopped).toEqual([KEY]);
  });

  it("keeps the draft and the timer when the network is out", async () => {
    const h = harness(() => "network");
    h.pending[KEY] = v1;
    await h.run(KEY);
    expect(h.cleared).toEqual([]);
    expect(h.started).toEqual([KEY]);
    expect(h.states).toEqual(["saving", "retrying"]);
  });
});

describe("postPending: a judge switch throws the answer away", () => {
  it("writes nothing into the next judge's page when the POST lands after the switch", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const score = s(KEY, "2026-09-19T19:00:00.000Z", 20);
    const h = harness(async (body) => {
      await gate;
      return echo(body);
    });
    h.pending[KEY] = score;

    const inFlight = postPending(h.deps, KEY);
    /* "Not you? Switch" while the request is in the air. */
    h.switchJudge();
    release();
    await inFlight;

    expect(h.sent).toHaveLength(1);
    expect(h.scores[KEY]).toBeUndefined();
    expect(h.states).toEqual(["saving"]); // nothing after the switch
    expect(h.cleared).toEqual([]);
    expect(h.stopped).toEqual([]);
    expect(h.started).toEqual([]);
  });
});

/* ── two devices, one team, over the server's real rule ──────────────
   The store mirrors api/scores.ts: it writes whatever arrives and
   echoes it back with its own clock. The device mirrors the hook's
   pending-and-draft loop. */
function server() {
  const store: Record<string, Score> = {};
  let clock = 0;
  return {
    store,
    post: (body: Score): Score => {
      clock += 1;
      store[body.teamKey] = { ...body, savedAt: `2026-09-19T20:00:0${clock}.000Z` };
      return store[body.teamKey];
    },
  };
}

function device(srv: ReturnType<typeof server>) {
  const pending: Record<string, Score> = {};
  const drafts: Record<string, Score> = {};
  let online = false;

  const attempt = (teamKey: string): void => {
    const score = pending[teamKey];
    if (!score || !online) return; // offline: the draft and the timer both stay
    const acked = srv.post(score);
    if (nextPending(pending[teamKey], acked)) { attempt(teamKey); return; }
    delete pending[teamKey];
    delete drafts[teamKey];
  };

  return {
    pending, drafts,
    connect: (v: boolean) => { online = v; },
    save: (score: Score) => { drafts[score.teamKey] = score; pending[score.teamKey] = score; attempt(score.teamKey); },
    tick: () => { for (const key of Object.keys(pending)) attempt(key); },
    /* What this device shows after a reload. */
    reload: (): Record<string, Score> => mergeScores(Object.values(srv.store), Object.values(drafts)),
  };
}

describe("two offline saves, then the network comes back", () => {
  it("ends with v2 on the server and clears the draft only once v2 is acknowledged", () => {
    const srv = server();
    const d = device(srv);
    const v1 = s(KEY, "2026-09-19T19:00:00.000Z", 20, { comment: "First pass at the feedback." });
    const v2 = s(KEY, "2026-09-19T19:05:00.000Z", 32, { comment: "Corrected: the demo does work.", lines: [8, 8, 8, 8] });

    d.save(v1);
    expect(srv.store[KEY]).toBeUndefined();
    expect(d.drafts[KEY].total).toBe(20);

    d.save(v2);
    expect(srv.store[KEY]).toBeUndefined();
    expect(d.pending[KEY].total).toBe(32); // v2 replaced v1 in pending
    expect(d.drafts[KEY].total).toBe(32);

    d.connect(true);
    d.tick();

    expect(srv.store[KEY].total).toBe(32);
    expect(srv.store[KEY].comment).toBe("Corrected: the demo does work.");
    expect(srv.store[KEY].clientSavedAt).toBe("2026-09-19T19:05:00.000Z");
    expect(d.drafts[KEY]).toBeUndefined();
    expect(d.pending[KEY]).toBeUndefined();
  });

  it("keeps saving normally once the network is back", () => {
    const srv = server();
    const d = device(srv);
    d.connect(true);
    d.save(s(KEY, "2026-09-19T19:20:00.000Z", 28));
    expect(srv.store[KEY].total).toBe(28);
    expect(d.drafts[KEY]).toBeUndefined();
  });
});

describe("two devices, one team, clocks that disagree", () => {
  /* The phone is seven minutes fast. The judge scores from it, walks to
     the laptop, sees the score is wrong and corrects it. The correction
     leaves later and carries the older stamp. Deciding on the stamp
     threw the correction away and told the judge it was Saved. */
  it("holds the correction that arrived last, whatever the stamps say", () => {
    const srv = server();
    const phone = device(srv);
    const laptop = device(srv);
    phone.connect(true);
    laptop.connect(true);

    phone.save(s(KEY, "2026-09-19T19:12:00.000Z", 20, { comment: "Scored from the phone first." }));
    expect(srv.store[KEY].total).toBe(20);

    laptop.save(s(KEY, "2026-09-19T19:05:00.000Z", 36, { comment: "Corrected: the demo does work.", lines: [9, 9, 9, 9] }));

    expect(srv.store[KEY].total).toBe(36);
    expect(srv.store[KEY].comment).toBe("Corrected: the demo does work.");
    expect(srv.store[KEY].clientSavedAt).toBe("2026-09-19T19:05:00.000Z");
    expect(laptop.drafts[KEY]).toBeUndefined(); // acknowledged, so nothing is owed
    expect(laptop.pending[KEY]).toBeUndefined();
    /* And both screens say so after a reload, including the phone that
       wrote the copy the correction replaced. */
    expect(laptop.reload()[KEY].total).toBe(36);
    expect(phone.reload()[KEY].total).toBe(36);
  });

  /* The same shape one step further: a retry that was queued while the
     wifi was out still arrives last and still wins, because the device
     that queued it has nothing newer of its own. */
  it("holds a late retry from the other device too", () => {
    const srv = server();
    const phone = device(srv);
    const laptop = device(srv);
    laptop.connect(true);
    laptop.save(s(KEY, "2026-09-19T19:30:00.000Z", 36));

    phone.save(s(KEY, "2026-09-19T19:10:00.000Z", 12, { comment: "Saved on the phone in a dead spot." }));
    phone.connect(true);
    phone.tick();

    expect(srv.store[KEY].total).toBe(12);
    expect(phone.drafts[KEY]).toBeUndefined();
  });
});
