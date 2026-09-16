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
});
