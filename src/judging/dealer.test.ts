import { describe, expect, it } from "vitest";
import { deal, judgesForTrack } from "./dealer";
import type { Judge } from "./types";

const J = (id: string, tracks: Judge["tracks"]): Judge => ({ id, name: id, tracks });
const teams = (track: "build" | "pitch", n: number, offset = 0) =>
  Array.from({ length: n }, (_, i) => ({ teamKey: `${track}/t${i + 1}`, track, n: offset + i + 1 }));

describe("judgesForTrack", () => {
  it("includes the track and both, excludes the other and off", () => {
    const js = [J("a", "build"), J("b", "pitch"), J("c", "both"), J("d", "off")];
    expect(judgesForTrack(js, "build").map((j) => j.id)).toEqual(["a", "c"]);
    expect(judgesForTrack(js, "pitch").map((j) => j.id)).toEqual(["b", "c"]);
  });
});

describe("deal", () => {
  it("gives every team k distinct judges and keeps loads within one", () => {
    const judges = [J("a", "build"), J("b", "build"), J("c", "build"), J("d", "both"), J("e", "pitch"), J("f", "pitch")];
    const subs = [...teams("build", 20), ...teams("pitch", 10, 20)];
    const d = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [] });
    for (const s of subs) {
      const js = d.assignments[s.teamKey];
      expect(js).toHaveLength(2);
      expect(new Set(js).size).toBe(2);
      for (const id of js) expect(judgesForTrack(judges, s.track).map((j) => j.id)).toContain(id);
    }
    const buildLoads = ["a", "b", "c", "d"].map((id) => d.load[id]);
    expect(Math.max(...buildLoads) - Math.min(...buildLoads)).toBeLessThanOrEqual(1);
    expect(buildLoads.reduce((x, y) => x + y, 0)).toBe(40);
    expect(d.warnings).toEqual([]);
  });

  it("is deterministic", () => {
    const judges = [J("a", "both"), J("b", "both"), J("c", "both")];
    const subs = teams("build", 7);
    const first = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [] });
    const second = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [] });
    expect(second).toEqual(first);
  });

  it("warns and gives everyone when a track has fewer judges than the minimum", () => {
    const judges = [J("a", "build"), J("b", "pitch")];
    const d = deal({ submissions: teams("pitch", 3), judges, minPerTeam: 2, excluded: [] });
    expect(d.assignments["pitch/t1"]).toEqual(["b"]);
    expect(d.warnings[0]).toMatch(/pitch/i);
  });

  it("warns when a track has no judges at all", () => {
    const d = deal({ submissions: teams("build", 2), judges: [J("a", "pitch")], minPerTeam: 2, excluded: [] });
    expect(d.assignments["build/t1"]).toEqual([]);
    expect(d.warnings.some((w) => /no judge/i.test(w))).toBe(true);
  });

  it("skips duplicates and excluded teams", () => {
    const subs = [...teams("build", 3), { teamKey: "build/t1", track: "build" as const, n: 9, duplicateOf: 1 }];
    const d = deal({ submissions: subs, judges: [J("a", "build"), J("b", "build")], minPerTeam: 2, excluded: ["build/t3"] });
    expect(Object.keys(d.assignments).sort()).toEqual(["build/t1", "build/t2"]);
  });

  it("keeps fully-assigned existing teams byte-identical and balances new teams against real loads", () => {
    const judges = [J("a", "build"), J("b", "build"), J("c", "build"), J("d", "build")];
    const existingSubs = teams("build", 20);
    const newSubs = Array.from({ length: 10 }, (_, i) => ({ teamKey: `build/new${i + 1}`, track: "build" as const, n: 20 + i + 1 }));
    const first = deal({ submissions: existingSubs, judges, minPerTeam: 2, excluded: [] });
    const d = deal({
      submissions: [...existingSubs, ...newSubs],
      judges,
      minPerTeam: 2,
      excluded: [],
      existing: first.assignments,
    });
    for (const s of existingSubs) {
      expect(d.assignments[s.teamKey]).toEqual(first.assignments[s.teamKey]);
    }
    for (const s of newSubs) {
      expect(d.assignments[s.teamKey]).toHaveLength(2);
      expect(new Set(d.assignments[s.teamKey]).size).toBe(2);
    }
    const loads = ["a", "b", "c", "d"].map((id) => d.load[id]);
    expect(loads.reduce((x, y) => x + y, 0)).toBe(60);
    expect(Math.max(...loads) - Math.min(...loads)).toBeLessThanOrEqual(1);
    expect(d.warnings).toEqual([]);
  });

  it("tops up a team with one existing judge to the minimum, not beyond it", () => {
    const judges = [J("a", "build"), J("b", "build"), J("c", "build")];
    const subs = teams("build", 1);
    const existing = { "build/t1": ["a"] };
    const d = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [], existing });
    expect(d.assignments["build/t1"]).toContain("a");
    expect(d.assignments["build/t1"]).toHaveLength(2);
  });

  it("removes a judge switched to Off from kept assignments, tops the team up, and warns", () => {
    const judges = [
      { id: "grant", name: "Grant Johnson", tracks: "off" as const },
      J("b", "build"),
      J("c", "build"),
    ];
    const subs = teams("build", 3);
    const existing = {
      "build/t1": ["grant", "b"],
      "build/t2": ["b", "c"],
      "build/t3": ["grant", "c"],
    };
    const d = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [], existing });
    expect(d.assignments["build/t1"]).not.toContain("grant");
    expect(d.assignments["build/t1"]).toHaveLength(2);
    expect(d.assignments["build/t2"]).toEqual(["b", "c"]);
    expect(d.assignments["build/t3"]).not.toContain("grant");
    expect(d.assignments["build/t3"]).toHaveLength(2);
    expect(d.warnings.some((w) => w === "Grant Johnson is off the Build track; 2 teams were re-dealt.")).toBe(true);
  });

  it("with no existing argument, behaves exactly like a full re-deal", () => {
    const judges = [J("a", "both"), J("b", "both"), J("c", "both")];
    const subs = teams("build", 7);
    const withExisting = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [], existing: {} });
    const withoutExisting = deal({ submissions: subs, judges, minPerTeam: 2, excluded: [] });
    expect(withExisting).toEqual(withoutExisting);
  });
});
