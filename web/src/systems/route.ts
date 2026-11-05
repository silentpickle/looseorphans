// Breadth-first paths over a map grid, for tap-to-walk: the shortest run of cells from where she stands to the
// first cell that satisfies the goal.

export interface Cell {
  cx: number;
  cy: number;
}

const STEPS: readonly Cell[] = [
  { cx: 1, cy: 0 },
  { cx: -1, cy: 0 },
  { cx: 0, cy: 1 },
  { cx: 0, cy: -1 },
];

const key = (cell: Cell): string => `${cell.cx},${cell.cy}`;

function unwind(prev: ReadonlyMap<string, Cell | null>, end: Cell): Cell[] {
  const path: Cell[] = [];
  for (let at: Cell | null = end; at !== null; at = prev.get(key(at)) ?? null) path.unshift(at);
  return path.slice(1); // she is already standing on the first cell
}

/** The cells to walk through (start excluded), or null when no open cell meets the goal. */
export function route(
  from: Cell,
  isGoal: (cell: Cell) => boolean,
  open: (cell: Cell) => boolean,
): Cell[] | null {
  const prev = new Map<string, Cell | null>([[key(from), null]]);
  const queue: Cell[] = [from];
  for (let at = queue.shift(); at !== undefined; at = queue.shift()) {
    if (isGoal(at)) return unwind(prev, at);
    const fresh = STEPS.map((step) => ({ cx: at.cx + step.cx, cy: at.cy + step.cy })).filter(
      (next) => !prev.has(key(next)) && open(next),
    );
    for (const next of fresh) prev.set(key(next), at);
    queue.push(...fresh);
  }
  return null;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.cx === b.cx && a.cy === b.cy;
}

/** Side by side (not diagonal): close enough to talk. */
export function besideCell(a: Cell, b: Cell): boolean {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy) === 1;
}
