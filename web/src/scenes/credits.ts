// The end: the credits roll over the title art, then the post-credits gag, then back to the title.
import Phaser from "phaser";
import { CAMPAIGN } from "@campaign";
import { playMusic } from "../audio/music";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { creditLines } from "../data/credits";
import type { Line } from "../data/credits";
import { Controls } from "../input/controls";
import { getState } from "../registry";
import { endingFor } from "../systems/meter";
import {
  ACCENT_COLOR,
  DIM_COLOR,
  FONT_SIZE_SMALL,
  FONT_SIZE_TITLE,
  TEXT_COLOR,
  textStyle,
} from "../ui/theme";

const HALF = 2;
const CENTER = 0.5;
const LINE_GAP = 22;
const HINT_INSET = 8; // the hint sits in the top-right corner, clear of the roll
const SCROLL_PX_PER_S = 34;
const FAST_FACTOR = 4;
const MS_PER_S = 1000;
const ART_SCALE = 2;
const SHADE = 0x000000;
const SHADE_ALPHA = 0.55;
const OUTLINE = { stroke: "#000000", strokeThickness: 4 };
const GAG_HOLD_MS = 5200;
const FADE_MS = 900;
const MUSIC = CAMPAIGN.title.music;
const BACKDROP_KEY = CAMPAIGN.title.backdrop;

function styleFor(kind: Line["kind"]): Phaser.Types.GameObjects.Text.TextStyle {
  if (kind === "title") return { ...textStyle(FONT_SIZE_TITLE, ACCENT_COLOR), ...OUTLINE };
  if (kind === "head") return { ...textStyle(undefined, ACCENT_COLOR), ...OUTLINE };
  return { ...textStyle(undefined, TEXT_COLOR), ...OUTLINE };
}

export class CreditsScene extends Phaser.Scene {
  private controls!: Controls;
  private roll!: Phaser.GameObjects.Container;
  private rollHeight = 0;
  private finished = false;

  constructor() {
    super("credits");
  }

  create(): void {
    this.controls = new Controls(this);
    this.finished = false;
    playMusic(this, MUSIC);
    if (this.textures.exists(BACKDROP_KEY))
      this.add.image(0, 0, BACKDROP_KEY).setOrigin(0).setScale(ART_SCALE);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, SHADE, SHADE_ALPHA).setOrigin(0);
    this.buildRoll(creditLines(endingFor(getState(this).meter)));
    this.add
      .text(
        GAME_WIDTH - HINT_INSET,
        HINT_INSET,
        "hold A or touch to speed up",
        textStyle(FONT_SIZE_SMALL, DIM_COLOR),
      )
      .setOrigin(1, 0)
      .setDepth(1);
  }

  override update(_time: number, delta: number): void {
    if (this.finished) return;
    const fast = this.controls.heldA();
    const speed = SCROLL_PX_PER_S * (fast ? FAST_FACTOR : 1);
    this.roll.y -= (speed * delta) / MS_PER_S;
    if (this.roll.y + this.rollHeight < 0) this.postCredits();
  }

  private buildRoll(lines: readonly Line[]): void {
    this.roll = this.add.container(GAME_WIDTH / HALF, GAME_HEIGHT);
    lines.forEach((line, index) => {
      const text = this.add.text(0, index * LINE_GAP, line.text, styleFor(line.kind)).setOrigin(CENTER);
      this.roll.add(text);
    });
    this.rollHeight = lines.length * LINE_GAP;
  }

  /** Bopig mops the stage. Lio is still baking. */
  private postCredits(): void {
    this.finished = true;
    this.roll.destroy();
    const gag = this.add
      .text(GAME_WIDTH / HALF, GAME_HEIGHT / HALF, CAMPAIGN.credits.postCredits, {
        ...styleFor("body"),
        align: "center",
      })
      .setOrigin(CENTER)
      .setAlpha(0);
    this.tweens.add({ targets: gag, alpha: 1, duration: FADE_MS });
    this.time.delayedCall(GAG_HOLD_MS, () => {
      this.cameras.main.fadeOut(FADE_MS);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("title");
      });
    });
  }
}
