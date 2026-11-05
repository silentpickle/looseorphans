import type Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { textStyle } from "../ui/theme";
import * as grid from "./grid";
import type { RunnerFactory } from "./runner";
import type { GridSpec } from "./types";
import type { Point } from "../input/controls";

const HALF = 2;
const CENTER = 0.5;
const CELL = 28;
const TOP_Y = 110;
const CURSOR_COLOR = 0xffd166;
const CURSOR_W = 2;
const GLYPHS: Record<string, { fill: number; label: string }> = {
  "#": { fill: 0xc8964a, label: "" }, // dalgona shape, untraced
  "*": { fill: 0x7dffb0, label: "" }, // traced
  ".": { fill: 0xe0b878, label: "" }, // cookie / empty board
  o: { fill: 0xe0b878, label: "○" }, // bully stone
  x: { fill: 0xe0b878, label: "●" }, // your stone
  L: { fill: 0x9fd8ff, label: "" }, // glass pane (side hidden)
  R: { fill: 0x9fd8ff, label: "" },
};
const UNKNOWN = { fill: 0x333333, label: "" };
const CROSSED = 0x59d1ff;

function boardWidth(spec: GridSpec, state: grid.GridState): number {
  return spec.rule === "path" ? HALF : (state.cells[0]?.length ?? 0);
}

/** The board cell under a tap, or null off the board. On a path only the column matters: she picks a side. */
function cellAt(spec: GridSpec, state: grid.GridState, left: number, point: Point): grid.Cell | null {
  const cx = Math.floor((point.x - left) / CELL);
  const cy = spec.rule === "path" ? state.row : Math.floor((point.y - TOP_Y) / CELL);
  const width = boardWidth(spec, state);
  if (cx < 0 || cx >= width || cy < 0 || cy >= state.cells.length) return null;
  return { cx, cy };
}

function cellFill(spec: GridSpec, state: grid.GridState, cx: number, cy: number): number {
  if (spec.rule === "path") return cy < state.row ? CROSSED : (GLYPHS.L ?? UNKNOWN).fill;
  return (GLYPHS[state.cells[cy]?.[cx] ?? ""] ?? UNKNOWN).fill;
}

export const gridRunner: RunnerFactory<GridSpec> = (scene, spec, depth) => {
  const state = grid.fresh(spec);
  const cursor = { cx: 0, cy: 0 };
  const width = boardWidth(spec, state);
  const left = GAME_WIDTH / HALF - (width * CELL) / HALF;
  const board = scene.add.graphics().setDepth(depth);
  const labels: Phaser.GameObjects.Text[] = [];
  const draw = (): void => {
    board.clear();
    labels.forEach((label) => {
      label.destroy();
    });
    labels.length = 0;
    state.cells.forEach((row, cy) => {
      for (let cx = 0; cx < width; cx++) {
        board
          .fillStyle(cellFill(spec, state, cx, cy), 1)
          .fillRect(left + cx * CELL, TOP_Y + cy * CELL, CELL - 1, CELL - 1);
        const label = spec.rule === "path" ? "" : (GLYPHS[row[cx] ?? ""] ?? UNKNOWN).label;
        if (label !== "")
          labels.push(
            scene.add
              .text(left + cx * CELL + CELL / HALF, TOP_Y + cy * CELL + CELL / HALF, label, {
                ...textStyle(),
                color: "#000000",
              })
              .setOrigin(CENTER)
              .setDepth(depth + 1),
          );
      }
    });
    const cy = spec.rule === "path" ? state.row : cursor.cy;
    board
      .lineStyle(CURSOR_W, CURSOR_COLOR, 1)
      .strokeRect(left + cursor.cx * CELL, TOP_Y + cy * CELL, CELL - 1, CELL - 1);
  };
  draw();
  return {
    step: (time, _delta, controls) => {
      const rows = state.cells.length;
      cursor.cx = (cursor.cx + controls.menuSide(time) + width) % width;
      if (spec.rule !== "path") cursor.cy = (cursor.cy + controls.menuStep(time) + rows) % rows;
      const tap = controls.tapped();
      const tapped = tap === null ? null : cellAt(spec, state, left, tap);
      if (tapped !== null) Object.assign(cursor, tapped);
      if (tapped !== null || controls.pressedA()) grid.apply(spec, state, cursor);
      draw();
      if (grid.isWon(spec, state)) return { won: true, score: grid.score(spec, state) };
      if (grid.isLost(spec, state)) return { won: false, score: 0 };
      return null;
    },
    status: () => `used ${state.used}/${spec.moves}`,
  };
};
