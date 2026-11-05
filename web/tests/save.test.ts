import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadSave, writeSave } from "../src/systems/save";
import { GameState } from "../src/systems/state";

/** A Map-backed stand-in for the browser's localStorage. */
class FakeStorage {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

describe("saves", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { value: new FakeStorage(), configurable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("S1_current_ids: a save naming members this build has loads back", () => {
    const state = new GameState();
    state.party = ["m1", "m2"];
    writeSave(state.toSave());
    expect(loadSave()?.party).toEqual(["m1", "m2"]);
  });
  it("S2_old_ids: a save naming members this build lacks is ignored", () => {
    const state = new GameState();
    state.party = ["m1", "retired" as never];
    writeSave(state.toSave());
    expect(loadSave()).toBeNull();
  });
});
