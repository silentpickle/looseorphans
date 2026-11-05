import { describe, expect, it } from "vitest";
import * as timing from "../src/minigames/timing";
import type { TimingSpec } from "../src/minigames/types";

const spec: TimingSpec = {
  kind: "timing",
  id: "t",
  title: "T",
  prompt: "",
  rounds: 2,
  lives: 2,
  sweepsPerSecond: 1,
  window: 0.2,
  invert: false,
};

describe("timing bar", () => {
  it("marker bounces edge to edge", () => {
    expect(timing.markerAt(spec, 0)).toBe(0);
    expect(timing.markerAt(spec, 500)).toBe(0.5);
    expect(timing.markerAt(spec, 1000)).toBe(1);
    expect(timing.markerAt(spec, 1500)).toBe(0.5);
  });

  it("window edges count as inside, just outside does not", () => {
    expect(timing.insideWindow(spec, 0.6)).toBe(true);
    expect(timing.insideWindow(spec, 0.4)).toBe(true);
    expect(timing.insideWindow(spec, 0.601)).toBe(false);
  });

  it("press at the middle hits, at the edge misses, and invert flips it", () => {
    const state = timing.fresh();
    state.t = 500;
    expect(timing.press(spec, state)).toBe("hit");
    state.t = 50;
    expect(timing.press(spec, state)).toBe("miss");
    const inverted = { ...spec, invert: true };
    state.t = 500;
    expect(timing.press(inverted, state)).toBe("miss");
  });

  it("finishes on rounds or lives and scores the fraction", () => {
    const state = timing.fresh();
    state.hits = 2;
    expect(timing.finished(spec, state)).toBe(true);
    expect(timing.won(spec, state)).toBe(true);
    const lost = { t: 0, hits: 1, misses: 2 };
    expect(timing.finished(spec, lost)).toBe(true);
    expect(timing.won(spec, lost)).toBe(false);
    expect(timing.score(spec, lost)).toBe(0.5);
  });
});
