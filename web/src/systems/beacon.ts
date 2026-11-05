// The flashing "go here" marker on the map: shown only when one thing is clearly next. Something new is a person
// with words she hasn't heard yet, or an open way to a place she hasn't been. Exactly one new thing gets the
// marker; with nothing new left and a single way out, that way out gets it. Anything else stays unmarked.

export interface BeaconNpc {
  glyph: string;
  visible: boolean;
  dialogue: string; // the dialogue she would hear now (its variant already chosen)
}

export interface BeaconWarp {
  glyph: string;
  open: boolean;
  map: string;
}

export interface BeaconWorld {
  npcs: readonly BeaconNpc[];
  warps: readonly BeaconWarp[];
  heard: (dialogue: string) => boolean;
  visited: (map: string) => boolean;
}

/** The glyph to mark, or null when there is a choice to make (or nothing to do). */
export function beacon(world: BeaconWorld): string | null {
  const people = world.npcs
    .filter((npc) => npc.visible && !world.heard(npc.dialogue))
    .map((npc) => npc.glyph);
  const ways = world.warps.filter((warp) => warp.open);
  const places = ways.filter((warp) => !world.visited(warp.map)).map((warp) => warp.glyph);
  const fresh = [...people, ...places];
  if (fresh.length > 0) return fresh.length === 1 ? (fresh[0] ?? null) : null;
  return ways.length === 1 ? (ways[0]?.glyph ?? null) : null;
}
