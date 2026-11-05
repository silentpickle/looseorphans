// Pins what the main game's build is made of today, so moving it onto a campaign object changes nothing.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CAST } from "../src/cast";
import { portraitFor } from "../src/data/art";
import { CHAPTERS, CHAPTER_ORDER } from "../src/data/chapters";
import { creditLines } from "../src/data/credits";
import { ENEMIES } from "../src/data/enemies";
import { FIGURES } from "../src/data/figures";
import { ITEMS } from "../src/data/items";
import { ENDING_A_THRESHOLD, METER_MAX } from "../src/systems/meter";
import { writeSave } from "../src/systems/save";
import { GameState } from "../src/systems/state";
import { VOLUME_KEY } from "../src/ui/volume";

/** A Map-backed stand-in for the browser's localStorage. */
const JSON_INDENT = 1;

/** One recorded text file per cast, so the fictional defaults and a private cast each pin their own wording. */
function pinFile(name: string): string {
  return `./__snapshots__/main-pin.${CAST.source}.${name}.txt`;
}

function asText(value: unknown): string {
  return JSON.stringify(value, null, JSON_INDENT);
}

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

function speakersOf(): Record<string, string | undefined> {
  const names = Object.values(CHAPTERS).flatMap((chapter) =>
    Object.values(chapter.dialogues).flatMap((nodes) => nodes.map((node) => node.speaker)),
  );
  const unique = [...new Set(names.filter((name): name is string => name !== undefined))].sort();
  return Object.fromEntries(unique.map((name) => [name, portraitFor(name)]));
}

describe("main build", () => {
  let store: FakeStorage;
  beforeEach(() => {
    store = new FakeStorage();
    Object.defineProperty(globalThis, "localStorage", { value: store, configurable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("plays its chapters in order", () => {
    expect(CHAPTER_ORDER).toEqual(["prologue", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "finale"]);
  });
  it("loads exactly these figures", async () => {
    await expect(asText(FIGURES)).toMatchFileSnapshot(pinFile("figures"));
  });
  it("knows exactly these items", async () => {
    await expect(asText(Object.keys(ITEMS))).toMatchFileSnapshot(pinFile("items"));
  });
  it("knows exactly these enemies", async () => {
    await expect(asText(Object.keys(ENEMIES))).toMatchFileSnapshot(pinFile("enemies"));
  });
  it("gives each speaker this portrait", async () => {
    await expect(asText(speakersOf())).toMatchFileSnapshot(pinFile("speakers"));
  });
  it("starts a new state in the prologue", () => {
    expect(new GameState().chapter).toBe("prologue");
  });
  it("saves under its own key", () => {
    writeSave(new GameState().toSave());
    expect([...store.data.keys()]).toEqual([`${CAST.terms["slug"]}.save`]);
  });
  it("keeps the volume under its own key", () => {
    expect(VOLUME_KEY).toBe(`${CAST.terms["slug"]}.volume`);
  });
  it("fills the meter to 70 and picks ending A at 50", () => {
    expect([METER_MAX, ENDING_A_THRESHOLD]).toEqual([70, 50]);
  });
  it("rolls these credits for ending A", async () => {
    await expect(asText(creditLines("A"))).toMatchFileSnapshot(pinFile("creditsA"));
  });
  it("rolls these credits for ending B", async () => {
    await expect(asText(creditLines("B"))).toMatchFileSnapshot(pinFile("creditsB"));
  });
});
