import { describe, expect, it } from "vitest";
import { FACING_BONUS, dirOf, pickTalkTarget } from "../src/systems/talk";

const CELL = 32;
const REACH = 60;
const ME = { x: 7 * CELL, y: 6 * CELL };
const left = { id: "m6", x: 6 * CELL, y: 6 * CELL };
const diagonal = { id: "m7", x: 6 * CELL, y: 5 * CELL };
const far = { id: "far", x: 12 * CELL, y: 6 * CELL };

describe("who A talks to", () => {
  it("D1_listed_first: the nearer person wins even when listed second", () => {
    expect(pickTalkTarget([diagonal, left], ME, REACH, "down")?.id).toBe("m6");
  });

  it("D2_facing_tie: the person ahead beats an equally near one beside", () => {
    const above = { id: "above", x: 7 * CELL, y: 5 * CELL };
    expect(pickTalkTarget([above, left], ME, REACH, "left")?.id).toBe("m6");
    expect(pickTalkTarget([left, above], ME, REACH, "up")?.id).toBe("above");
  });

  it("D3_facing_bonus: a person facing-ahead loses to one much nearer", () => {
    const ahead = { id: "ahead", x: ME.x - REACH, y: ME.y };
    const close = { id: "close", x: ME.x, y: ME.y + 1 };
    expect(pickTalkTarget([ahead, close], ME, REACH, "left")?.id).toBe("close");
    expect(FACING_BONUS).toBeLessThan(REACH);
  });

  it("D4_out_of_reach: nobody past the reach is chosen, the edge still counts", () => {
    expect(pickTalkTarget([far], ME, REACH, "right")).toBeUndefined();
    const edge = { id: "edge", x: ME.x + REACH, y: ME.y };
    expect(pickTalkTarget([edge], ME, REACH, "right")?.id).toBe("edge");
    const past = { id: "past", x: ME.x + REACH + 1, y: ME.y };
    expect(pickTalkTarget([past], ME, REACH, "right")).toBeUndefined();
  });

  it("D5_direction_of: the larger axis decides, standing on top keeps the old facing", () => {
    expect(dirOf(-5, 1, "down")).toBe("left");
    expect(dirOf(1, 5, "left")).toBe("down");
    expect(dirOf(0, 0, "up")).toBe("up");
  });
});
