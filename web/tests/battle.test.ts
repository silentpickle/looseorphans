import { describe, expect, it } from "vitest";
import { SKILLS } from "../src/data/skills";
import { WEATHER } from "../src/data/weather";
import * as battle from "../src/systems/battle";

const fixed = (value: number) => () => value;
const MID = 0.5;

describe("battle rules", () => {
  it("damage is atk*2 - def at mid variance, never below one", () => {
    const attacker = { hp: 1, mp: 0, atk: 10, def: 0, mag: 0, spd: 0 };
    const defender = { hp: 1, mp: 0, atk: 0, def: 5, mag: 0, spd: 0 };
    expect(battle.damage(attacker, defender, 1, fixed(MID))).toBe(15);
    const wall = { ...defender, def: 999 };
    expect(battle.damage(attacker, wall, 1, fixed(MID))).toBe(1);
  });

  it("gauge fills by speed and reports the first ready combatant", () => {
    const fast = battle.partyCombatant("m2", 10, 10);
    const slow = battle.partyCombatant("m3", 10, 10);
    battle.tick([fast, slow], 100);
    expect(fast.gauge).toBeGreaterThan(slow.gauge);
    expect(battle.ready([fast, slow])).toBeUndefined();
    battle.tick([fast, slow], 100_000);
    expect(battle.ready([slow, fast])?.key).toBe(slow.key);
    expect(fast.gauge).toBe(battle.GAUGE_FULL);
  });

  it("dead combatants neither fill nor act", () => {
    const dead = battle.partyCombatant("m1", 0, 0);
    battle.tick([dead], 100_000);
    expect(dead.gauge).toBe(0);
    expect(battle.ready([dead])).toBeUndefined();
  });

  it("heal caps at max hp and reports the amount", () => {
    const m1 = battle.partyCombatant("m1", 60, 10);
    expect(battle.heal(m1, 100)).toBe(10);
    expect(m1.hp).toBe(70);
  });

  it("outcome follows who is standing", () => {
    const m1 = battle.partyCombatant("m1", 10, 0);
    const anti = battle.enemyCombatant("anti", 0);
    expect(battle.outcome([m1, anti])).toBeNull();
    battle.hurt(m1, 999);
    expect(battle.outcome([m1, anti])).toBe("lost");
    m1.hp = 10;
    battle.hurt(anti, 999);
    expect(battle.outcome([m1, anti])).toBe("won");
  });

  it("L1_enemy_lines: a pointing line names the target, a whole sentence does not take it mid-sentence", () => {
    expect(battle.enemyAttackText("Guard", "points a triangle at", "Sol")).toBe(
      "Guard points a triangle at Sol!",
    );
    expect(battle.enemyAttackText("Guard", "buries the post of", "Sol")).toBe(
      "Guard buries the post of Sol!",
    );
    expect(battle.enemyAttackText("Anti", "types in all caps", "Lio")).toBe(
      "Anti types in all caps. Lio takes it!",
    );
    expect(battle.enemyAttackText("Sprite", "smiles at you. It's worse.", "Sol")).toBe(
      "Sprite smiles at you. It's worse. Sol takes it!",
    );
    expect(battle.enemyAttackText("Clause", "subsections at you", "Sol")).toBe(
      "Clause subsections at you. Sol takes it!",
    );
  });

  it("E1_encore_charge: a hit moves both gauges, and full is ready at exactly the limit", () => {
    const m1 = battle.partyCombatant("m1", 70, 30);
    const anti = battle.enemyCombatant("anti", 0);
    battle.chargeEncore(m1, anti, 10);
    expect(m1.encore).toBe(12.5); // 10 dealt at 1.25
    expect(anti.encore).toBe(30); // 10 taken at 3
    m1.encore = battle.ENCORE_FULL - 1;
    expect(battle.encoreReady(m1)).toBe(false);
    m1.encore = battle.ENCORE_FULL;
    expect(battle.encoreReady(m1)).toBe(true);
    battle.chargeEncore(m1, anti, 1000);
    expect(m1.encore).toBe(battle.ENCORE_FULL);
  });

  it("M1_magic_school: a magic attack reads mag, a physical one reads atk", () => {
    const caster = { hp: 1, mp: 0, atk: 4, def: 0, mag: 10, spd: 0 };
    const wall = { hp: 1, mp: 0, atk: 0, def: 5, mag: 0, spd: 0 };
    expect(battle.damage(caster, wall, 1, fixed(MID), "magic")).toBe(15);
    expect(battle.damage(caster, wall, 1, fixed(MID), "physical")).toBe(3);
    expect(battle.damage(caster, wall, 1, fixed(MID))).toBe(3);
  });

  it("M2_weather_scale: rain lifts magic and dulls blows, heat does the reverse", () => {
    const m4 = battle.partyCombatant("m4", 68, 36);
    const anti = battle.enemyCombatant("anti", 0);
    const clear = battle.strikeAmount(m4, anti, 1, fixed(MID), {
      weather: WEATHER.clear,
      school: "magic",
    });
    const rainy = battle.strikeAmount(m4, anti, 1, fixed(MID), {
      weather: WEATHER.rain,
      school: "magic",
    });
    const hot = battle.strikeAmount(m4, anti, 1, fixed(MID), {
      weather: WEATHER.heatwave,
      school: "magic",
    });
    expect(rainy).toBeGreaterThan(clear);
    expect(hot).toBeLessThan(clear);
    const blow = battle.strikeAmount(m4, anti, 1, fixed(MID), { weather: WEATHER.clear });
    expect(battle.strikeAmount(m4, anti, 1, fixed(MID), { weather: WEATHER.rain })).toBeLessThan(blow);
    expect(battle.strikeAmount(m4, anti, 1, fixed(MID), { weather: WEATHER.heatwave })).toBeGreaterThan(blow);
  });

  it("M3_caster_skills: exactly the five caster spells are magic", () => {
    const magic = Object.values(SKILLS)
      .filter((skill) => skill.school === "magic")
      .map((skill) => skill.id)
      .sort();
    expect(magic).toEqual(["m1_a", "m4_a", "m4_b", "m6_b", "m7_a"]);
  });

  it("spoils sum enemy stay points", () => {
    const group = [battle.enemyCombatant("anti", 0), battle.enemyCombatant("commenter", 1)];
    expect(battle.spoils(group)).toBe(30);
  });
});
