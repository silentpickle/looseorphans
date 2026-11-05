// Where enemies stand in a battle. A lone enemy stands centred; a group fans out down and to the right so that no
// sprite (or the name under it) sits behind another. No Phaser in here.

export interface Slot {
  x: number;
  y: number;
}

export const ENEMY_X = 150;
export const SOLO_Y = 140;
export const GROUP_Y0 = 100;
export const GROUP_Y_STEP = 60;
/** A bit wider than a full-size enemy (96 px), so sprites in a group never overlap sideways either. */
export const GROUP_X_STEP = 100;
const HALF = 2;
const ONE = 1;

export function enemySlot(index: number, count: number): Slot {
  if (count <= ONE) return { x: ENEMY_X, y: SOLO_Y };
  const spread = ((count - ONE) * GROUP_X_STEP) / HALF;
  return { x: ENEMY_X - spread + index * GROUP_X_STEP, y: GROUP_Y0 + index * GROUP_Y_STEP };
}
