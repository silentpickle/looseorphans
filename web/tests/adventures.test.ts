// The adventure a page plays: the address wins, then the one chosen last time, then the first game.
import { describe, expect, it } from "vitest";
import { chooseAdventure } from "../src/campaigns/active";
import { ADVENTURES, DEFAULT_ADVENTURE, adventureById } from "../src/campaigns/index";

const MAIN = "main";
const UNKNOWN = "no-such-adventure";
const TITLE_ROW = 32; // characters of 14 px text that fit the select list beside the cursor
const OTHER = ADVENTURES.at(-1)?.campaign.id ?? MAIN;

describe("choosing an adventure", () => {
  it("defaults to the first game", () => {
    expect(chooseAdventure("", null)).toBe(DEFAULT_ADVENTURE);
    expect(DEFAULT_ADVENTURE).toBe(MAIN);
  });
  it("takes the one named in the address over the remembered one", () => {
    expect(chooseAdventure(`?adventure=${OTHER}`, MAIN)).toBe(OTHER);
  });
  it("falls back to the remembered one", () => {
    expect(chooseAdventure("?qa=1", OTHER)).toBe(OTHER);
  });
  it("ignores an unknown id in the address and in memory", () => {
    expect(chooseAdventure(`?adventure=${UNKNOWN}`, UNKNOWN)).toBe(DEFAULT_ADVENTURE);
  });
  it("gives every adventure its own id and save (the volume is one setting for them all)", () => {
    const ids = ADVENTURES.map((a) => a.campaign.id);
    const saves = ADVENTURES.map((a) => a.campaign.saveKey);
    for (const list of [ids, saves]) expect(new Set(list).size).toBe(list.length);
    for (const id of ids) expect(adventureById(id)?.campaign.id).toBe(id);
  });
  it("fits every title on one row of the select list", () => {
    for (const { campaign } of ADVENTURES)
      expect(campaign.settings.title.length).toBeLessThanOrEqual(TITLE_ROW);
  });
});
