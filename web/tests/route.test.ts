import { describe, expect, it } from "vitest";
import { besideCell, route, sameCell } from "../src/systems/route";
import type { Cell } from "../src/systems/route";

const GRID = [
  // a wall with one gap at the bottom
  "..#..",
  "..#..",
  ".....",
];

const open = (cell: Cell): boolean => (GRID[cell.cy]?.[cell.cx] ?? "#") !== "#";
const at = (cx: number, cy: number) => (cell: Cell) => sameCell(cell, { cx, cy });

describe("route", () => {
  it("walks around a wall the short way", () => {
    const path = route({ cx: 0, cy: 0 }, at(4, 0), open) ?? [];
    expect(path).toHaveLength(8); // down 2, across 4, up 2
    expect(path.at(-1)).toEqual({ cx: 4, cy: 0 });
    expect(path).toContainEqual({ cx: 2, cy: 2 }); // through the gap
    expect(path.every(open)).toBe(true);
  });
  it("is empty when she is already there", () => {
    expect(route({ cx: 1, cy: 1 }, at(1, 1), open)).toEqual([]);
  });
  it("is null when the goal is a wall", () => {
    expect(route({ cx: 0, cy: 0 }, at(2, 0), open)).toBeNull();
  });
  it("stops at the first cell beside a goal it cannot stand on", () => {
    const path = route({ cx: 0, cy: 2 }, (cell) => besideCell(cell, { cx: 2, cy: 0 }), open);
    expect(path).toEqual([
      { cx: 1, cy: 2 },
      { cx: 1, cy: 1 },
      { cx: 1, cy: 0 },
    ]);
  });
});

describe("besideCell", () => {
  it("counts side by side, not diagonal or the same cell", () => {
    expect(besideCell({ cx: 1, cy: 1 }, { cx: 2, cy: 1 })).toBe(true);
    expect(besideCell({ cx: 1, cy: 1 }, { cx: 2, cy: 2 })).toBe(false);
    expect(besideCell({ cx: 1, cy: 1 }, { cx: 1, cy: 1 })).toBe(false);
  });
});
