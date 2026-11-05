import { describe, expect, it } from "vitest";
import { ENDING_A_THRESHOLD, METER_MAX, clampMeter, endingFor } from "../src/systems/meter";

describe("main meter", () => {
  it("clamps to its range", () => {
    expect(clampMeter(-5)).toBe(0);
    expect(clampMeter(METER_MAX + 1)).toBe(METER_MAX);
  });
  it("picks ending A at the threshold and B one below", () => {
    expect(endingFor(ENDING_A_THRESHOLD)).toBe("A");
    expect(endingFor(ENDING_A_THRESHOLD - 1)).toBe("B");
  });
});
