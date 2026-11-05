// The timing bar: a marker sweeps a bar; press A inside the sweet spot. Pure rules, no Phaser, so the skins
// (Red Light, tea pour, bass-off, archery) are all tested here and the scene only draws.
import type { TimingSpec } from "./types";

const MS_PER_S = 1000;
const SWEEP = 2; // a marker goes there and back in one period
const MIDDLE = 0.5;
const HALF = 2;

export interface TimingState {
  t: number; // elapsed ms
  hits: number;
  misses: number;
}

export function fresh(): TimingState {
  return { t: 0, hits: 0, misses: 0 };
}

/** Marker position 0..1, bouncing edge to edge. */
export function markerAt(spec: TimingSpec, t: number): number {
  const period = MS_PER_S / spec.sweepsPerSecond;
  const phase = (t % (period * SWEEP)) / period; // 0..2
  return phase <= 1 ? phase : SWEEP - phase;
}

/** The sweet spot is centred; inside means within window/2 of the middle. */
export function insideWindow(spec: TimingSpec, position: number): boolean {
  const half = spec.window / HALF;
  return Math.abs(position - MIDDLE) <= half;
}

/** A press at time t: a hit, or a miss. With invert, pressing inside the zone is the mistake. */
export function press(spec: TimingSpec, state: TimingState): "hit" | "miss" {
  const inside = insideWindow(spec, markerAt(spec, state.t));
  const good = spec.invert ? !inside : inside;
  if (good) state.hits += 1;
  else state.misses += 1;
  return good ? "hit" : "miss";
}

export function finished(spec: TimingSpec, state: TimingState): boolean {
  return state.hits >= spec.rounds || state.misses >= spec.lives;
}

export function won(spec: TimingSpec, state: TimingState): boolean {
  return state.hits >= spec.rounds;
}

export function score(spec: TimingSpec, state: TimingState): number {
  return Math.min(1, state.hits / spec.rounds);
}
