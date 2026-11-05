// The flashing "go here" marker: a small gold arrow that bobs and blinks over a person, or over a doorway with a
// pulsing ring on the cell itself. Drawn by the overworld when systems/beacon.ts picks one thing.
import type Phaser from "phaser";

const GOLD = 0xffd166;
const INK = 0x000000;
const ARROW_HALF_W = 7;
const ARROW_H = 10;
const OUTLINE_W = 2;
const RING_RADIUS = 11;
const RING_W = 3;
const BOB_PX = 5;
const BOB_MS = 450;
const BLINK_MS = 380;
const BLINK_LOW = 0.3;
const RING_FROM = 0.7;
const RING_TO = 1.25;
const RING_MS = 700;
const DEPTH = 400; // over every figure (their depth is their y, at most the screen height)

export interface MarkSpot {
  x: number; // the arrow's tip
  y: number;
  ring?: { x: number; y: number }; // a doorway's cell centre
}

function arrow(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y }).setDepth(DEPTH);
  g.fillStyle(GOLD, 1).lineStyle(OUTLINE_W, INK, 1);
  g.fillTriangle(-ARROW_HALF_W, -ARROW_H, ARROW_HALF_W, -ARROW_H, 0, 0);
  g.strokeTriangle(-ARROW_HALF_W, -ARROW_H, ARROW_HALF_W, -ARROW_H, 0, 0);
  scene.tweens.add({
    targets: g,
    y: y - BOB_PX,
    duration: BOB_MS,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  return g;
}

function ring(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y }).setDepth(DEPTH);
  g.lineStyle(RING_W, GOLD, 1).strokeCircle(0, 0, RING_RADIUS);
  scene.tweens.add({ targets: g, scale: { from: RING_FROM, to: RING_TO }, duration: RING_MS, repeat: -1 });
  return g;
}

/** Draw the marker; hand back its pieces so the caller can take it down. */
export function drawMark(scene: Phaser.Scene, spot: MarkSpot): Phaser.GameObjects.Graphics[] {
  const pieces = [arrow(scene, spot.x, spot.y)];
  if (spot.ring !== undefined) pieces.push(ring(scene, spot.ring.x, spot.ring.y));
  scene.tweens.add({ targets: pieces, alpha: BLINK_LOW, duration: BLINK_MS, yoyo: true, repeat: -1 });
  return pieces;
}

export function eraseMark(scene: Phaser.Scene, pieces: readonly Phaser.GameObjects.Graphics[]): void {
  scene.tweens.killTweensOf(pieces);
  for (const piece of pieces) piece.destroy();
}
