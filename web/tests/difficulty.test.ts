import { describe, expect, it } from "vitest";
import type { Difficulty } from "../src/systems/difficulty";
import { easeMinigame, encoreCharge, encounterRate, foeDamage, foeHp } from "../src/systems/difficulty";
import type { GridSpec, RhythmSpec, TimingSpec } from "../src/minigames/types";

const normal: Difficulty = {
  enemy_hp: 1,
  enemy_damage: 1,
  encounter_rate: 1,
  encore_charge: 1,
  minigame_window: 1,
  minigame_extra_lives: 0,
  rhythm_pass: 1,
};
const easy: Difficulty = {
  enemy_hp: 0.6,
  enemy_damage: 0.6,
  encounter_rate: 0.5,
  encore_charge: 1.5,
  minigame_window: 1.4,
  minigame_extra_lives: 1,
  rhythm_pass: 0.8,
};
const timing: TimingSpec = {
  kind: "timing",
  id: "t",
  title: "T",
  prompt: "",
  rounds: 3,
  lives: 2,
  sweepsPerSecond: 1,
  window: 0.2,
  invert: false,
};
const rhythm: RhythmSpec = { kind: "rhythm", id: "r", title: "R", bpm: 100, pattern: ["L"], passScore: 0.75 };
const grid: GridSpec = { kind: "grid", id: "g", title: "G", rule: "path", grid: ["L"], moves: 2 };

describe("difficulty", () => {
  it("normal changes nothing", () => {
    expect(foeHp(200, normal)).toBe(200);
    expect(foeDamage(17, normal)).toBe(17);
    expect(encounterRate(0.03, normal)).toBe(0.03);
    expect(encoreCharge(10, normal)).toBe(10);
    expect(easeMinigame(timing, normal)).toEqual(timing);
    expect(easeMinigame(rhythm, normal)).toEqual(rhythm);
    expect(easeMinigame(grid, normal)).toEqual(grid);
  });

  it("easy softens fights but damage never drops to zero", () => {
    expect(foeHp(200, easy)).toBe(120);
    expect(foeDamage(10, easy)).toBe(6);
    expect(foeDamage(1, easy)).toBe(1);
    expect(encounterRate(0.03, easy)).toBeCloseTo(0.015);
    expect(encoreCharge(10, easy)).toBe(15);
  });

  it("easy widens sweet spots, narrows danger zones, and adds a life", () => {
    const eased = easeMinigame(timing, easy) as TimingSpec;
    expect(eased.window).toBeCloseTo(0.28);
    expect(eased.lives).toBe(3);
    const danger = easeMinigame({ ...timing, invert: true, window: 0.35 }, easy) as TimingSpec;
    expect(danger.window).toBeCloseTo(0.25);
    expect((easeMinigame(rhythm, easy) as RhythmSpec).passScore).toBeCloseTo(0.6);
    expect((easeMinigame(grid, easy) as GridSpec).moves).toBe(3);
  });

  it("a sweet spot never covers the whole bar", () => {
    const huge = easeMinigame({ ...timing, window: 0.8 }, easy) as TimingSpec;
    expect(huge.window).toBe(0.9);
  });
});
