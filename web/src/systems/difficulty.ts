// How hard the game is, from config.toml [difficulty]. Pure helpers: each takes the settings, so tests can pass
// their own; the game passes DIFFICULTY.
import type { GridSpec, MinigameSpec, RhythmSpec, TimingSpec } from "../minigames/types";
import { SETTINGS } from "../config";

export type Difficulty = DifficultySettings;

export const DIFFICULTY: Difficulty = SETTINGS.difficulty[SETTINGS.difficulty.level];

const MIN_DAMAGE = 1;
const MAX_WINDOW = 0.9; // a sweet spot never covers the whole bar
const MIN_WINDOW = 0.05; // a danger zone never vanishes

export function foeHp(hp: number, d: Difficulty = DIFFICULTY): number {
  return Math.max(1, Math.round(hp * d.enemy_hp));
}

export function foeDamage(amount: number, d: Difficulty = DIFFICULTY): number {
  return Math.max(MIN_DAMAGE, Math.round(amount * d.enemy_damage));
}

export function encounterRate(rate: number, d: Difficulty = DIFFICULTY): number {
  return rate * d.encounter_rate;
}

export function encoreCharge(amount: number, d: Difficulty = DIFFICULTY): number {
  return amount * d.encore_charge;
}

function easeTiming(spec: TimingSpec, d: Difficulty): TimingSpec {
  const window = spec.invert ? spec.window / d.minigame_window : spec.window * d.minigame_window;
  return {
    ...spec,
    window: Math.min(MAX_WINDOW, Math.max(MIN_WINDOW, window)),
    lives: spec.lives + d.minigame_extra_lives,
  };
}

function easeRhythm(spec: RhythmSpec, d: Difficulty): RhythmSpec {
  return { ...spec, passScore: spec.passScore * d.rhythm_pass };
}

function easeGrid(spec: GridSpec, d: Difficulty): GridSpec {
  return { ...spec, moves: spec.moves + d.minigame_extra_lives };
}

/** The minigame as this difficulty plays it. */
export function easeMinigame(spec: MinigameSpec, d: Difficulty = DIFFICULTY): MinigameSpec {
  if (spec.kind === "timing") return easeTiming(spec, d);
  if (spec.kind === "rhythm") return easeRhythm(spec, d);
  return easeGrid(spec, d);
}
