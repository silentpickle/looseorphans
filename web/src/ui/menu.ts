// A vertical list with a cursor: title options, battle commands, targets, dialogue choices. Keys move the cursor;
// a tap or click on a row puts the cursor there and says so, and the scene treats that as choosing it.
import Phaser from "phaser";
import type { Point } from "../input/controls";
import { CURSOR, DIM_COLOR, LINE_HEIGHT, PADDING, textStyle } from "./theme";

export const CURSOR_GAP = 16;

export class Menu {
  private readonly labels: Phaser.GameObjects.Text[] = [];
  private readonly cursor: Phaser.GameObjects.Text;
  private index = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly items: readonly string[],
    private readonly enabled: readonly boolean[] = items.map(() => true),
    depth = 1,
  ) {
    this.cursor = scene.add.text(x, y, CURSOR, textStyle()).setDepth(depth);
    this.items.forEach((item, i) => {
      const color = this.enabled[i] === false ? DIM_COLOR : undefined;
      this.labels.push(
        scene.add
          .text(x + CURSOR_GAP, y + i * LINE_HEIGHT, item, textStyle(undefined, color))
          .setDepth(depth),
      );
    });
    this.place();
  }

  get selected(): number {
    return this.index;
  }

  get isEnabled(): boolean {
    return this.enabled[this.index] ?? false;
  }

  /** Put the cursor on the row under a tap; true when the tap was on a row (enabled or not). */
  tapTo(point: Point | null): boolean {
    if (point === null) return false;
    const row = this.rowAt(point);
    if (row === null) return false;
    this.index = row;
    this.place();
    return true;
  }

  /** The row under a point, forgiving by a padding's width all round (rows are small under a finger). */
  private rowAt(point: Point): number | null {
    const widest = Math.max(...this.labels.map((label) => label.width));
    const right = this.x + CURSOR_GAP + widest + PADDING;
    if (point.x < this.x - PADDING || point.x > right) return null;
    const count = this.items.length;
    const offset = point.y - this.y;
    if (offset < -PADDING || offset > count * LINE_HEIGHT + PADDING) return null;
    return Math.min(count - 1, Math.max(0, Math.floor(offset / LINE_HEIGHT)));
  }

  move(delta: number): void {
    const count = this.items.length;
    this.index = (this.index + delta + count) % count;
    this.place();
  }

  destroy(): void {
    this.cursor.destroy();
    for (const label of this.labels) label.destroy();
  }

  private place(): void {
    this.cursor.setPosition(this.x, this.y + this.index * LINE_HEIGHT);
  }
}
