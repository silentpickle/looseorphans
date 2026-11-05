// Who A talks to: the closest person in reach, with the one she faces winning a near tie. No Phaser in here.
import type { Dir } from "../data/types";

export interface Spot {
  x: number;
  y: number;
}

/** A person she faces counts as this much closer, so a diagonal neighbour never beats the one in front of her. */
export const FACING_BONUS = 16;

export function dirOf(x: number, y: number, fallback: Dir): Dir {
  if (x === 0 && y === 0) return fallback;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? "right" : "left";
  return y > 0 ? "down" : "up";
}

function distance(a: Spot, b: Spot): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Smaller is better: the distance, less the bonus for the person straight ahead. */
function score(from: Spot, spot: Spot, facing: Dir): number {
  const ahead = dirOf(spot.x - from.x, spot.y - from.y, facing) === facing;
  return distance(from, spot) - (ahead ? FACING_BONUS : 0);
}

/** The candidate to talk to, or undefined when nobody is within `reach` pixels. */
export function pickTalkTarget<T extends Spot>(
  candidates: readonly T[],
  from: Spot,
  reach: number,
  facing: Dir,
): T | undefined {
  const inReach = candidates.filter((candidate) => distance(from, candidate) <= reach);
  const ranked = inReach.map((candidate) => ({ candidate, rank: score(from, candidate, facing) }));
  return ranked.reduce<(typeof ranked)[number] | undefined>(
    (best, next) => (best === undefined || next.rank < best.rank ? next : best),
    undefined,
  )?.candidate;
}
