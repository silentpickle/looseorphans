import { describe, expect, it } from "vitest";
import * as battle from "../src/systems/battle";
import * as status from "../src/systems/status";
import { WEATHER } from "../src/data/weather";

const mid = () => 0.5;

describe("statuses", () => {
  it("inflict keeps the longer duration and never duplicates", () => {
    const m1 = battle.partyCombatant("m1", 70, 30);
    status.inflict(m1, "stun", 1);
    status.inflict(m1, "stun", 3);
    expect(m1.statuses).toEqual([{ id: "stun", turns: 3 }]);
    expect(status.skipsTurn(m1)).toBe(true);
  });

  it("endTurn ticks statuses down and drops them at zero", () => {
    const m1 = battle.partyCombatant("m1", 70, 30);
    status.inflict(m1, "shield", 1);
    status.endTurn(m1);
    expect(m1.statuses).toEqual([]);
  });

  it("shield halves incoming damage; roasted softens outgoing", () => {
    const attacker = battle.partyCombatant("m5", 88, 16);
    const target = battle.enemyCombatant("anti", 0);
    const plain = battle.strikeAmount(attacker, target, 1, mid);
    status.inflict(target, "shield", 2);
    expect(battle.strikeAmount(attacker, target, 1, mid)).toBe(Math.round(plain * 0.5));
    target.statuses = [];
    status.inflict(attacker, "roasted", 2);
    expect(battle.strikeAmount(attacker, target, 1, mid)).toBe(Math.round(plain * 0.6));
  });

  it("weather scales attacks and the gauge", () => {
    const attacker = battle.partyCombatant("m5", 88, 16);
    const target = battle.enemyCombatant("anti", 0);
    const plain = battle.strikeAmount(attacker, target, 1, mid);
    expect(battle.strikeAmount(attacker, target, 1, mid, { weather: WEATHER.heatwave })).toBe(
      Math.round(plain * 1.3),
    );
    const slow = battle.partyCombatant("m2", 72, 20);
    const fast = battle.partyCombatant("m2", 72, 20);
    battle.tick([slow], 100, WEATHER.snow);
    battle.tick([fast], 100);
    expect(slow.gauge).toBeLessThan(fast.gauge);
  });

  it("encore fills from damage and reads ready exactly at full", () => {
    const m1 = battle.partyCombatant("m1", 70, 30);
    const anti = battle.enemyCombatant("anti", 0);
    battle.chargeEncore(anti, m1, 20); // 3 points of gauge per hp taken
    expect(m1.encore).toBe(60);
    battle.chargeEncore(anti, m1, 1000);
    expect(m1.encore).toBe(battle.ENCORE_FULL);
    expect(battle.encoreReady(m1)).toBe(true);
    m1.encore = battle.ENCORE_FULL - 1;
    expect(battle.encoreReady(m1)).toBe(false);
  });
});
