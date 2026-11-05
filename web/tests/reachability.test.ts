// Every warp and every NPC can be reached from every way into its map. NPCs block (except ones that only appear
// later), so an NPC standing in the only corridor fails here instead of in her hands.
import { describe, expect, it } from "vitest";
import type { Chapter, MapDef } from "../src/data/types";
import { ALL_CHAPTERS } from "./campaigns";

interface Cell {
  cx: number;
  cy: number;
}

const WALL = "#";
const STEPS: readonly Cell[] = [
  { cx: 1, cy: 0 },
  { cx: -1, cy: 0 },
  { cx: 0, cy: 1 },
  { cx: 0, cy: -1 },
];

const key = (c: Cell): string => `${c.cx},${c.cy}`;

function glyphCell(map: MapDef, glyph: string): Cell | null {
  for (const [cy, row] of map.grid.entries()) {
    const cx = row.indexOf(glyph);
    if (cx >= 0) return { cx, cy };
  }
  return null;
}

function blockers(map: MapDef): Set<string> {
  const cells = map.npcs.filter((npc) => npc.shownWhen === undefined).map((npc) => glyphCell(map, npc.glyph));
  return new Set(cells.filter((c): c is Cell => c !== null).map(key));
}

function neighbours(cell: Cell): Cell[] {
  return STEPS.map((step) => ({ cx: cell.cx + step.cx, cy: cell.cy + step.cy }));
}

function reachable(map: MapDef, from: Cell): Set<string> {
  const blocked = blockers(map);
  const seen = new Set([key(from)]);
  const queue = [from];
  const open = (c: Cell): boolean =>
    (map.grid[c.cy]?.[c.cx] ?? WALL) !== WALL && !blocked.has(key(c)) && !seen.has(key(c));
  for (let at = queue.shift(); at !== undefined; at = queue.shift()) {
    const fresh = neighbours(at).filter(open);
    for (const next of fresh) seen.add(key(next));
    queue.push(...fresh);
  }
  return seen;
}

function entries(chapter: Chapter, mapId: string): Cell[] {
  const start = chapter.start.map === mapId ? [{ cx: chapter.start.x, cy: chapter.start.y }] : [];
  const arrivals = Object.values(chapter.maps)
    .flatMap((map) => map.warps)
    .filter((warp) => warp.map === mapId)
    .map((warp) => ({ cx: warp.x, cy: warp.y }));
  const scripted = Object.values(chapter.dialogues)
    .flatMap((nodes) => nodes.map((node) => node.action))
    .flatMap((action) =>
      action?.kind === "warp" && action.map === mapId ? [{ cx: action.x, cy: action.y }] : [],
    );
  return [...start, ...arrivals, ...scripted];
}

function nextTo(seen: Set<string>, cell: Cell): boolean {
  return STEPS.some((step) => seen.has(key({ cx: cell.cx + step.cx, cy: cell.cy + step.cy })));
}

describe.each(ALL_CHAPTERS)("$campaign.id chapter $chapter.id", ({ chapter }) => {
  it.each(Object.values(chapter.maps))("map $id: warps and NPCs are reachable", (map) => {
    for (const entry of entries(chapter, map.id)) {
      expect(map.grid[entry.cy]?.[entry.cx], `${map.id} entry ${key(entry)} is a wall`).not.toBe(WALL);
      const seen = reachable(map, entry);
      for (const warp of map.warps) {
        const cell = glyphCell(map, warp.glyph);
        expect(cell !== null && seen.has(key(cell)), `${map.id}: warp ${warp.glyph} from ${key(entry)}`).toBe(
          true,
        );
      }
      for (const npc of map.npcs) {
        const cell = glyphCell(map, npc.glyph);
        expect(cell !== null && nextTo(seen, cell), `${map.id}: ${npc.id} from ${key(entry)}`).toBe(true);
      }
    }
  });
});
