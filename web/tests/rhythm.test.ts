import { describe, expect, it } from "vitest";
import * as rhythm from "../src/minigames/rhythm";
import type { RhythmSpec } from "../src/minigames/types";

const spec: RhythmSpec = {
  kind: "rhythm",
  id: "r",
  title: "R",
  bpm: 120,
  pattern: ["L", ".", "R", "U"],
  passScore: 0.75,
};

describe("rhythm", () => {
  it("schedules one note per non-rest beat after the lead-in", () => {
    const notes = rhythm.scheduleNotes(spec);
    expect(notes.map((n) => n.lane)).toEqual(["L", "R", "U"]);
    expect(notes.map((n) => n.atMs)).toEqual([1500, 2500, 3000]);
  });

  it("judges on the window edges", () => {
    expect(rhythm.judge(1000, 1120)).toBe("hit");
    expect(rhythm.judge(1000, 1121)).toBe("near");
    expect(rhythm.judge(1000, 1220)).toBe("near");
    expect(rhythm.judge(1000, 1221)).toBe("miss");
  });

  it("a press judges the right lane's note; a stray press does nothing", () => {
    const notes = rhythm.scheduleNotes(spec);
    expect(rhythm.press(notes, "R", 1500)).toBeNull();
    expect(rhythm.press(notes, "L", 1510)).toBe("hit");
    expect(rhythm.press(notes, "L", 1510)).toBeNull();
  });

  it("unpressed notes expire into misses and the game finishes", () => {
    const notes = rhythm.scheduleNotes(spec);
    rhythm.expire(notes, 3000 + rhythm.NEAR_MS);
    expect(rhythm.finished(notes)).toBe(false);
    rhythm.expire(notes, 3000 + rhythm.NEAR_MS + 1);
    expect(rhythm.finished(notes)).toBe(true);
    expect(rhythm.score(notes)).toBe(0);
  });

  it("scores near as half and passes at exactly passScore", () => {
    const notes = rhythm.scheduleNotes({ ...spec, pattern: ["L", "R", "U", "D"] });
    const results: rhythm.Judgement[] = ["hit", "hit", "near", "near"];
    notes.forEach((n, i) => {
      n.result = results[i] ?? "miss";
    });
    expect(rhythm.score(notes)).toBe(0.75);
    expect(rhythm.won(spec, notes)).toBe(true);
  });
});
