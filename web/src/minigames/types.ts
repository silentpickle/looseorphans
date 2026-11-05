// Three engines, many skins. A chapter asks for one with a spec; the scene plays it and reports a result.
export type Lane = "L" | "R" | "U" | "D" | ".";

export interface TimingSpec {
  kind: "timing";
  id: string;
  title: string;
  prompt: string; // one line under the bar, e.g. "Pour when the cup is full"
  rounds: number; // hits needed
  lives: number; // misses allowed
  sweepsPerSecond: number; // marker speed; each sweep goes edge to edge
  window: number; // sweet-spot width as a fraction of the bar, 0..1
  invert: boolean; // true = the sweet spot is the danger zone (Red Light: press only while green)
}

export interface RhythmSpec {
  kind: "rhythm";
  id: string;
  title: string;
  bpm: number;
  pattern: readonly Lane[]; // one entry per beat; "." is a rest
  passScore: number; // 0..1 fraction of notes hit
}

export type GridRule = "trace" | "surround" | "path";

export interface GridSpec {
  kind: "grid";
  id: string;
  title: string;
  rule: GridRule;
  grid: readonly string[]; // see docs/minigames.md for the glyphs each rule reads
  moves: number; // moves allowed (path/surround) or wrong cells allowed (trace)
}

export type MinigameSpec = TimingSpec | RhythmSpec | GridSpec;

export interface MinigameResult {
  won: boolean;
  score: number; // 0..1
}

export interface MinigameData {
  spec: MinigameSpec;
  onDone: (result: MinigameResult) => void;
}
