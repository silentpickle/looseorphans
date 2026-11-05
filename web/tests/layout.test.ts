import { describe, expect, it } from "vitest";
import { ENEMY_X, GROUP_X_STEP, SOLO_Y, enemySlot } from "../src/systems/layout";

const ENEMY_SIZE = 96; // a full-size enemy, as drawn
const LABEL_HEIGHT = 16;
const LABEL_GAP = 4;
const WINDOW_TOP = 250; // the status and command windows start here
const MESSAGE_BOTTOM = 38; // the message bar ends here
const PAIR = 2;
const TRIO = 3;
const GROUPS = [PAIR, TRIO];

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const sprite = (index: number, count: number): Box => {
  const { x, y } = enemySlot(index, count);
  const half = ENEMY_SIZE / PAIR;
  return { left: x - half, right: x + half, top: y - half, bottom: y + half };
};

const withLabel = (box: Box): Box => ({ ...box, bottom: box.bottom + LABEL_GAP + LABEL_HEIGHT });

const overlaps = (a: Box, b: Box): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe("enemy layout", () => {
  it("G1_solo_centred: a lone enemy stands where the old layout put it", () => {
    expect(enemySlot(0, 1)).toEqual({ x: ENEMY_X, y: SOLO_Y });
  });

  it("G2_pair_clear: two enemies and their names never overlap each other", () => {
    expect(overlaps(withLabel(sprite(0, PAIR)), withLabel(sprite(1, PAIR)))).toBe(false);
    expect(GROUP_X_STEP).toBeGreaterThanOrEqual(ENEMY_SIZE);
  });

  it("G3_group_on_screen: every enemy and name sits between the message bar and the windows", () => {
    const boxes = [...GROUPS].flatMap((count) =>
      Array.from({ length: count }, (_, i) => ({ count, box: withLabel(sprite(i, count)) })),
    );
    for (const { box } of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.top).toBeGreaterThan(MESSAGE_BOTTOM);
    }
    for (const { box } of boxes.filter((entry) => entry.count === PAIR))
      expect(box.bottom).toBeLessThan(WINDOW_TOP);
  });
});
