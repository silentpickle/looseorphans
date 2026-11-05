// Grid puzzle rules: trace (dalgona), surround (baduk), path (glass bridge). One small rule set each, in a table.
import type { GridRule, GridSpec } from "./types";

export interface Cell {
  cx: number;
  cy: number;
}

export interface GridState {
  cells: string[][];
  used: number; // cracks (trace), stones placed (surround), lives lost (path)
  row: number; // path only: the next row to cross
}

const SHAPE = "#";
const MARKED = "*";
const BULLY = "o";
const MINE = "x";
const EMPTY = ".";
const LEFT = "L";
const NEIGHBOURS: readonly Cell[] = [
  { cx: 1, cy: 0 },
  { cx: -1, cy: 0 },
  { cx: 0, cy: 1 },
  { cx: 0, cy: -1 },
];

export function fresh(spec: GridSpec): GridState {
  return { cells: spec.grid.map((row) => Array.from(row)), used: 0, row: 0 };
}

function at(state: GridState, cell: Cell): string | undefined {
  return state.cells[cell.cy]?.[cell.cx];
}

function put(state: GridState, cell: Cell, glyph: string): void {
  const row = state.cells[cell.cy];
  if (row !== undefined && cell.cx >= 0 && cell.cx < row.length) row[cell.cx] = glyph;
}

// --- trace -----------------------------------------------------------------------------------------------------

function traceApply(state: GridState, cell: Cell): void {
  const glyph = at(state, cell);
  if (glyph === SHAPE) put(state, cell, MARKED);
  else if (glyph === EMPTY) state.used += 1;
}

function traceWon(state: GridState): boolean {
  return state.cells.every((row) => !row.includes(SHAPE));
}

// --- surround --------------------------------------------------------------------------------------------------

function surroundApply(state: GridState, cell: Cell): void {
  if (at(state, cell) !== EMPTY) return;
  put(state, cell, MINE);
  state.used += 1;
}

function neighbours(cell: Cell): Cell[] {
  return NEIGHBOURS.map((step) => ({ cx: cell.cx + step.cx, cy: cell.cy + step.cy }));
}

function keyOf(cell: Cell): string {
  return `${cell.cx},${cell.cy}`;
}

/** Every empty cell touching the group that contains `start`. */
function liberties(state: GridState, start: Cell): number {
  const seen = new Set<string>();
  const free = new Set<string>();
  const stack = [start];
  for (let cell = stack.pop(); cell !== undefined; cell = stack.pop()) {
    if (seen.has(keyOf(cell))) continue;
    seen.add(keyOf(cell));
    const around = neighbours(cell);
    for (const next of around.filter((n) => at(state, n) === EMPTY)) free.add(keyOf(next));
    stack.push(...around.filter((n) => at(state, n) === BULLY));
  }
  return free.size;
}

function bullyCells(state: GridState): Cell[] {
  return state.cells.flatMap((row, cy) => row.flatMap((glyph, cx) => (glyph === BULLY ? [{ cx, cy }] : [])));
}

function surroundWon(state: GridState): boolean {
  return bullyCells(state).every((cell) => liberties(state, cell) === 0);
}

// --- path ------------------------------------------------------------------------------------------------------

/** cx 0 is the left pane, 1 the right; the row's letter says which side holds. */
function pathApply(state: GridState, cell: Cell): void {
  const safe = state.cells[state.row]?.[0];
  if (safe === undefined) return;
  const chose = cell.cx === 0 ? LEFT : "R";
  if (chose === safe) state.row += 1;
  else state.used += 1;
}

function pathWon(state: GridState): boolean {
  return state.row >= state.cells.length;
}

// --- the table -------------------------------------------------------------------------------------------------

interface RuleSet {
  apply: (state: GridState, cell: Cell) => void;
  isWon: (state: GridState) => boolean;
}

const RULES: Record<GridRule, RuleSet> = {
  trace: { apply: traceApply, isWon: traceWon },
  surround: { apply: surroundApply, isWon: surroundWon },
  path: { apply: pathApply, isWon: pathWon },
};

export function apply(spec: GridSpec, state: GridState, cell: Cell): void {
  if (isWon(spec, state) || isLost(spec, state)) return;
  RULES[spec.rule].apply(state, cell);
}

export function isWon(spec: GridSpec, state: GridState): boolean {
  return RULES[spec.rule].isWon(state);
}

/** Out of moves: for surround the last stone may still win, so lost means out of stones and not won. */
export function isLost(spec: GridSpec, state: GridState): boolean {
  return state.used >= spec.moves && !isWon(spec, state);
}

export function score(spec: GridSpec, state: GridState): number {
  if (!isWon(spec, state)) return 0;
  return 1 - state.used / (spec.moves + 1);
}
