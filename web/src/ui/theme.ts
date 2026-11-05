import type Phaser from "phaser";

export const FONT = "'Courier New', monospace";
export const FONT_SIZE = 14;
export const FONT_SIZE_SMALL = 12;
export const FONT_SIZE_TITLE = 28;
export const TEXT_COLOR = "#ffffff";
export const DIM_COLOR = "#9aa5c4";
export const ACCENT_COLOR = "#ffd166";
export const WINDOW_TOP = 0x1b2a6b;
export const WINDOW_BOTTOM = 0x060a1f;
export const WINDOW_BORDER = 0xffffff;
export const WINDOW_RADIUS = 6;
export const WINDOW_BORDER_WIDTH = 2;
export const WINDOW_ALPHA = 0.94;
export const PADDING = 10;
export const LINE_HEIGHT = 18;
export const CURSOR = "▶";

export function drawWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  g.fillGradientStyle(WINDOW_TOP, WINDOW_TOP, WINDOW_BOTTOM, WINDOW_BOTTOM, WINDOW_ALPHA);
  g.fillRoundedRect(x, y, w, h, WINDOW_RADIUS);
  g.lineStyle(WINDOW_BORDER_WIDTH, WINDOW_BORDER, 1);
  g.strokeRoundedRect(x, y, w, h, WINDOW_RADIUS);
}

export function textStyle(
  size: number = FONT_SIZE,
  color: string = TEXT_COLOR,
): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT, fontSize: `${size}px`, color };
}
