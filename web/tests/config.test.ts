import { describe, expect, it } from "vitest";
import { GAME_HEIGHT, GAME_WIDTH } from "../src/config";

describe("settings", () => {
  it("come from config.toml", () => {
    expect(GAME_WIDTH).toBe(640);
    expect(GAME_HEIGHT).toBe(360);
  });
});
