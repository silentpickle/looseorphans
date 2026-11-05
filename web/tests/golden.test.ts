// Characterization of the public build: every player-visible and id-bearing piece of the main game, dumped to one text
// file. Runs against the fictional defaults; a private cast.local.toml build is checked by real-cast.test.ts instead.
import { describe, expect, it } from "vitest";
import { CAST } from "../src/cast";
import { dump } from "./golden-dump";

const GOLDEN_FILE = "./__snapshots__/golden.defaults.txt";
const USES_DEFAULTS = CAST.source === "defaults";

describe("golden dump", () => {
  it.skipIf(!USES_DEFAULTS)("matches the recorded build", async () => {
    await expect(dump()).toMatchFileSnapshot(GOLDEN_FILE);
  });
  it("leaves no cast token unresolved", () => {
    expect(dump()).not.toMatch(
      /\{(m\d|[a-z_0-9]+\.[a-z]+|slug|meter|fandom|barrier|currency|trio|cats?|aussie|unison)(\|upper)?\}/,
    );
  });
});
