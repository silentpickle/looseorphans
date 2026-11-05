import { describe, expect, it } from "vitest";
import { holds } from "../src/systems/conditions";

describe("holds", () => {
  const flags = { a: true, b: false };
  it("empty is true", () => {
    expect(holds(flags, undefined)).toBe(true);
    expect(holds(flags, "")).toBe(true);
  });
  it("reads flags and negation", () => {
    expect(holds(flags, "a")).toBe(true);
    expect(holds(flags, "b")).toBe(false);
    expect(holds(flags, "!b")).toBe(true);
    expect(holds(flags, "missing")).toBe(false);
    expect(holds(flags, "!missing")).toBe(true);
  });
  it("ands terms", () => {
    expect(holds(flags, "a&!b")).toBe(true);
    expect(holds(flags, "a&b")).toBe(false);
  });
});
