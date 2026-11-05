import { describe, expect, it } from "vitest";
import * as grid from "../src/minigames/grid";
import type { GridSpec } from "../src/minigames/types";

describe("grid: trace", () => {
  const spec: GridSpec = {
    kind: "grid",
    id: "d",
    title: "Dalgona",
    rule: "trace",
    grid: [".#.", "###"],
    moves: 2,
  };

  it("marking every shape cell wins", () => {
    const state = grid.fresh(spec);
    for (const cell of [
      { cx: 1, cy: 0 },
      { cx: 0, cy: 1 },
      { cx: 1, cy: 1 },
    ])
      grid.apply(spec, state, cell);
    expect(grid.isWon(spec, state)).toBe(false);
    grid.apply(spec, state, { cx: 2, cy: 1 });
    expect(grid.isWon(spec, state)).toBe(true);
  });

  it("cracks count; one short of the limit is still alive, at the limit is lost", () => {
    const state = grid.fresh(spec);
    grid.apply(spec, state, { cx: 0, cy: 0 });
    expect(grid.isLost(spec, state)).toBe(false);
    grid.apply(spec, state, { cx: 2, cy: 0 });
    expect(grid.isLost(spec, state)).toBe(true);
  });
});

describe("grid: surround", () => {
  const spec: GridSpec = {
    kind: "grid",
    id: "b",
    title: "Baduk",
    rule: "surround",
    grid: ["...", ".o.", "..."],
    moves: 4,
  };

  it("closing every liberty with the last stone wins rather than loses", () => {
    const state = grid.fresh(spec);
    for (const cell of [
      { cx: 1, cy: 0 },
      { cx: 0, cy: 1 },
      { cx: 2, cy: 1 },
    ])
      grid.apply(spec, state, cell);
    expect(grid.isWon(spec, state)).toBe(false);
    grid.apply(spec, state, { cx: 1, cy: 2 });
    expect(grid.isWon(spec, state)).toBe(true);
    expect(grid.isLost(spec, state)).toBe(false);
  });

  it("placing on an occupied cell costs nothing", () => {
    const state = grid.fresh(spec);
    grid.apply(spec, state, { cx: 1, cy: 1 });
    expect(state.used).toBe(0);
  });

  it("a connected group shares liberties", () => {
    const pair: GridSpec = { ...spec, grid: ["....", ".oo.", "...."], moves: 6 };
    const state = grid.fresh(pair);
    for (const cell of [
      { cx: 1, cy: 0 },
      { cx: 2, cy: 0 },
      { cx: 0, cy: 1 },
      { cx: 3, cy: 1 },
      { cx: 1, cy: 2 },
    ]) {
      grid.apply(pair, state, cell);
    }
    expect(grid.isWon(pair, state)).toBe(false);
    grid.apply(pair, state, { cx: 2, cy: 2 });
    expect(grid.isWon(pair, state)).toBe(true);
  });
});

describe("grid: path", () => {
  const spec: GridSpec = { kind: "grid", id: "g", title: "Glass", rule: "path", grid: ["L", "R"], moves: 2 };

  it("the safe pane advances, the wrong one costs a life", () => {
    const state = grid.fresh(spec);
    grid.apply(spec, state, { cx: 1, cy: 0 });
    expect(state.used).toBe(1);
    expect(state.row).toBe(0);
    grid.apply(spec, state, { cx: 0, cy: 0 });
    grid.apply(spec, state, { cx: 1, cy: 0 });
    expect(grid.isWon(spec, state)).toBe(true);
    expect(grid.score(spec, state)).toBeCloseTo(2 / 3);
  });

  it("no moves after the game is decided", () => {
    const state = grid.fresh(spec);
    grid.apply(spec, state, { cx: 1, cy: 0 });
    grid.apply(spec, state, { cx: 1, cy: 0 });
    expect(grid.isLost(spec, state)).toBe(true);
    grid.apply(spec, state, { cx: 0, cy: 0 });
    expect(state.row).toBe(0);
  });
});
