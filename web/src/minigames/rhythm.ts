// Rhythm rules: notes scheduled on beats, presses judged by how far off the beat they land. No Phaser.
import type { Lane, RhythmSpec } from "./types";

export const HIT_MS = 120;
export const NEAR_MS = 220;
export const LEAD_IN_MS = 1500; // time before the first beat, so notes can scroll in
const MS_PER_MINUTE = 60_000;
const NEAR_VALUE = 0.5;

export type Judgement = "hit" | "near" | "miss";
export type NoteLane = Exclude<Lane, ".">;

export interface Note {
  lane: NoteLane;
  atMs: number;
  result?: Judgement;
}

export function beatMs(spec: RhythmSpec): number {
  return MS_PER_MINUTE / spec.bpm;
}

export function scheduleNotes(spec: RhythmSpec): Note[] {
  const beat = beatMs(spec);
  const notes: Note[] = [];
  spec.pattern.forEach((lane, index) => {
    if (lane === ".") return;
    notes.push({ lane, atMs: LEAD_IN_MS + index * beat });
  });
  return notes;
}

export function judge(noteMs: number, pressMs: number): Judgement {
  const off = Math.abs(pressMs - noteMs);
  if (off <= HIT_MS) return "hit";
  if (off <= NEAR_MS) return "near";
  return "miss";
}

/** A press in a lane judges the earliest open note in that lane within reach; a stray press does nothing. */
export function press(notes: Note[], lane: NoteLane, atMs: number): Judgement | null {
  const note = notes.find(
    (n) => n.result === undefined && n.lane === lane && Math.abs(atMs - n.atMs) <= NEAR_MS,
  );
  if (note === undefined) return null;
  note.result = judge(note.atMs, atMs);
  return note.result;
}

/** Notes whose window has passed without a press become misses. */
export function expire(notes: Note[], nowMs: number): void {
  for (const note of notes) {
    if (note.result === undefined && nowMs - note.atMs > NEAR_MS) note.result = "miss";
  }
}

export function finished(notes: readonly Note[]): boolean {
  return notes.every((note) => note.result !== undefined);
}

export function score(notes: readonly Note[]): number {
  if (notes.length === 0) return 1;
  const value = notes.reduce(
    (sum, n) => sum + (n.result === "hit" ? 1 : n.result === "near" ? NEAR_VALUE : 0),
    0,
  );
  return value / notes.length;
}

export function won(spec: RhythmSpec, notes: readonly Note[]): boolean {
  return score(notes) >= spec.passScore;
}
