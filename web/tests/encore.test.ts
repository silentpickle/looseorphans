import { describe, expect, it } from "vitest";
import { ENCORES } from "../src/data/encores";
import * as battle from "../src/systems/battle";
import { performEncore } from "../src/systems/encore";

const mid = () => 0.5;

function at<T>(list: readonly T[], index: number): T {
  const item = list[index];
  if (item === undefined) throw new Error(`nothing at ${index}`);
  return item;
}

function field() {
  return [
    battle.partyCombatant("m1", 70, 30),
    battle.partyCombatant("m6", 30, 40),
    battle.enemyCombatant("anti", 0),
    battle.enemyCombatant("commenter", 1),
  ];
}

describe("encores", () => {
  it("attack_all hits every living enemy and empties the gauge", () => {
    const all = field();
    const m1 = at(all, 0);
    m1.encore = battle.ENCORE_FULL;
    const events = performEncore(ENCORES.m1, m1, all, mid);
    expect(events.map((e) => e.kind)).toEqual(["damage", "damage"]);
    expect(m1.encore).toBe(0);
  });

  it("attack_multi lands its hits and stops when the enemies are gone", () => {
    const all = [battle.partyCombatant("m2", 72, 20), battle.enemyCombatant("anti", 0)];
    at(all, 1).hp = 1;
    const events = performEncore(ENCORES.m2, at(all, 0), all, mid);
    expect(events).toHaveLength(1);
  });

  it("heal_all heals the living party up to max", () => {
    const all = field();
    const events = performEncore(ENCORES.m6, at(all, 1), all, mid);
    expect(events.every((e) => e.kind === "heal")).toBe(true);
    expect(at(all, 1).hp).toBe(66);
  });

  it("status encores inflict on the right side", () => {
    const all = field();
    performEncore(ENCORES.m4, at(all, 0), all, mid);
    expect(at(all, 2).statuses[0]?.id).toBe("charm");
    const party = field();
    performEncore(ENCORES.m3, at(party, 0), party, mid);
    expect(at(party, 1).statuses[0]?.id).toBe("shield");
  });

  it("a fallen actor does nothing", () => {
    const all = field();
    at(all, 0).hp = 0;
    expect(performEncore(ENCORES.m1, at(all, 0), all, mid)).toEqual([]);
  });
});
