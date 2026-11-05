// Plays a MinigameSpec with the engine's runner and reports the result to whoever launched it.
import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { Controls } from "../input/controls";
import { easeMinigame } from "../systems/difficulty";
import { gridRunner } from "../minigames/grid-runner";
import { rhythmRunner } from "../minigames/rhythm-runner";
import type { Runner } from "../minigames/runner";
import { timingRunner } from "../minigames/timing-runner";
import type { MinigameData, MinigameResult, MinigameSpec } from "../minigames/types";
import { ACCENT_COLOR, DIM_COLOR, FONT_SIZE_SMALL, FONT_SIZE_TITLE, textStyle } from "../ui/theme";

const CENTER = 0.5;
const HALF = 2;
const BACKGROUND = 0x0b1030;
const TITLE_Y = 70;
const STATUS_LIFT = 30;
const STATUS_Y = GAME_HEIGHT - STATUS_LIFT;
const RESULT_MS = 1200;
const DEPTH = 700;

function runnerFor(scene: Phaser.Scene, spec: MinigameSpec): Runner {
  if (spec.kind === "timing") return timingRunner(scene, spec, DEPTH + 1);
  if (spec.kind === "rhythm") return rhythmRunner(scene, spec, DEPTH + 1);
  return gridRunner(scene, spec, DEPTH + 1);
}

export class MinigameScene extends Phaser.Scene {
  private payload!: MinigameData;
  private controls!: Controls;
  private runner!: Runner;
  private status!: Phaser.GameObjects.Text;
  private over = false;

  constructor() {
    super("minigame");
  }

  init(data: MinigameData): void {
    this.payload = data;
    this.over = false;
  }

  create(): void {
    this.controls = new Controls(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, BACKGROUND).setOrigin(0).setDepth(DEPTH);
    const { spec } = this.payload;
    this.add
      .text(GAME_WIDTH / HALF, TITLE_Y, spec.title, textStyle(FONT_SIZE_TITLE, ACCENT_COLOR))
      .setOrigin(CENTER)
      .setDepth(DEPTH + 1);
    this.status = this.add
      .text(GAME_WIDTH / HALF, STATUS_Y, "", textStyle(FONT_SIZE_SMALL, DIM_COLOR))
      .setOrigin(CENTER)
      .setDepth(DEPTH + 1);
    this.runner = runnerFor(this, easeMinigame(spec));
  }

  override update(time: number, delta: number): void {
    if (this.over) return;
    const result = this.runner.step(time, delta, this.controls);
    this.status.setText(this.runner.status());
    if (result !== null) this.finish(result);
  }

  private finish(result: MinigameResult): void {
    this.over = true;
    this.status.setText(result.won ? "Clear!" : "Not this time...");
    this.time.delayedCall(RESULT_MS, () => {
      const done = this.payload.onDone;
      this.scene.stop();
      done(result);
    });
  }
}
