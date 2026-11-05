// The story meter as a small gauge on the map, for a campaign that shows it (off in this game).
import Phaser from "phaser";
import { ACCENT_COLOR, FONT_SIZE_SMALL, TEXT_COLOR, drawWindow, textStyle } from "./theme";

const X = 8;
const Y = 24; // under the map name, which fades
const W = 168;
const H = 30;
const INSET = 6;
const LABEL_Y = 4;
const SIDES = 2;
const BAR_Y = 20;
const BAR_H = 4;
const BAR_BACK = 0x2a3466;
const BAR_FILL = 0xb48cff; // purple, her colour
const BAR_FULL = 0xffd166;
const DEPTH = 390; // over every figure, under the beacon marker
const PERCENT = 100;

export class MeterHud {
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    private readonly name: string,
    private readonly max: number,
  ) {
    this.frame = scene.add.graphics().setDepth(DEPTH);
    drawWindow(this.frame, X, Y, W, H);
    this.label = scene.add
      .text(X + INSET, Y + LABEL_Y, "", textStyle(FONT_SIZE_SMALL, TEXT_COLOR))
      .setDepth(DEPTH);
    this.bar = scene.add.graphics().setDepth(DEPTH);
  }

  show(value: number): void {
    const share = Math.max(0, Math.min(1, value / this.max));
    const full = share >= 1;
    this.label.setText(`${this.name} ${Math.round(share * PERCENT)}% used`);
    this.label.setColor(full ? ACCENT_COLOR : TEXT_COLOR);
    const inner = W - INSET * SIDES;
    this.bar.clear();
    this.bar.fillStyle(BAR_BACK, 1).fillRect(X + INSET, Y + BAR_Y, inner, BAR_H);
    this.bar.fillStyle(full ? BAR_FULL : BAR_FILL, 1).fillRect(X + INSET, Y + BAR_Y, inner * share, BAR_H);
  }
}
