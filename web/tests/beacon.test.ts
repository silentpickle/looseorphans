import { describe, expect, it } from "vitest";
import { beacon } from "../src/systems/beacon";
import type { BeaconNpc, BeaconWarp, BeaconWorld } from "../src/systems/beacon";

function world(
  npcs: BeaconNpc[],
  warps: BeaconWarp[],
  heard: string[] = [],
  visited: string[] = [],
): BeaconWorld {
  return { npcs, warps, heard: (d) => heard.includes(d), visited: (m) => visited.includes(m) };
}

const ann: BeaconNpc = { glyph: "A", visible: true, dialogue: "ann" };
const bob: BeaconNpc = { glyph: "B", visible: true, dialogue: "bob" };
const door: BeaconWarp = { glyph: "^", open: true, map: "harbor" };
const back: BeaconWarp = { glyph: "v", open: true, map: "street" };

describe("beacon", () => {
  it("marks the one person with something new to say", () => {
    expect(beacon(world([ann, bob], [back], ["bob"], ["street"]))).toBe("A");
  });
  it("marks nothing when two people are new", () => {
    expect(beacon(world([ann, bob], [], [], []))).toBeNull();
  });
  it("marks nothing when a new person and a new place compete", () => {
    expect(beacon(world([ann], [door], [], []))).toBeNull();
  });
  it("marks the one new place once everyone has been heard", () => {
    expect(beacon(world([ann], [door, back], ["ann"], ["street"]))).toBe("^");
  });
  it("ignores hidden people and shut doors", () => {
    const hidden = { ...bob, visible: false };
    const shut = { ...door, open: false };
    expect(beacon(world([ann, hidden], [shut, back], [], ["street"]))).toBe("A");
  });
  it("marks the only way out when nothing is new", () => {
    expect(beacon(world([ann], [back], ["ann"], ["street"]))).toBe("v");
  });
  it("marks nothing when nothing is new and there are two ways out", () => {
    const side = { ...back, glyph: "<" };
    expect(beacon(world([ann], [back, side], ["ann"], ["street"]))).toBeNull();
  });
});
