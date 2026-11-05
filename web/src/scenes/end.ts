import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { Controls } from "../input/controls";
import { ACCENT_COLOR, DIM_COLOR, FONT_SIZE_SMALL, textStyle } from "../ui/theme";

const HALF = 2;

export interface EndData {
  text: string;
}

const CENTER = 0.5;
const HINT_GAP = 40;

export class EndScene extends Phaser.Scene {
  private controls!: Controls;
  private payload!: EndData;

  constructor() {
    super("end");
  }

  init(data: EndData): void {
    this.payload = data;
  }

  create(): void {
    this.controls = new Controls(this);
    this.add
      .text(GAME_WIDTH / HALF, GAME_HEIGHT / HALF, this.payload.text, {
        ...textStyle(undefined, ACCENT_COLOR),
        align: "center",
        wordWrap: { width: GAME_WIDTH - HINT_GAP },
      })
      .setOrigin(CENTER);
    this.add
      .text(
        GAME_WIDTH / HALF,
        GAME_HEIGHT / HALF + HINT_GAP,
        "Tap or press A to return to the title",
        textStyle(FONT_SIZE_SMALL, DIM_COLOR),
      )
      .setOrigin(CENTER);
  }

  override update(): void {
    if (this.controls.pressedAOrTap()) this.scene.start("title");
  }
}
