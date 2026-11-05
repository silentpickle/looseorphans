import type Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { textStyle } from "../ui/theme";
import type { RunnerFactory } from "./runner";
import * as timing from "./timing";
import type { TimingSpec } from "./types";

const HALF = 2;
const CENTER = 0.5;
const BAR_X = 120;
const BAR_W = GAME_WIDTH - BAR_X * HALF;
const BAR_Y = 190;
const BAR_H = 18;
const MARKER_W = 6;
const PROMPT_Y = 130;
const BAR_COLOR = 0x223355;
const ZONE_COLOR = 0x59d1ff;
const DANGER_COLOR = 0xff5959;
const MARKER_COLOR = 0xffffff;
const FLASH_MS = 300;
const FULL = 255;

function draw(bar: Phaser.GameObjects.Graphics, spec: TimingSpec, t: number): void {
  bar.clear();
  bar.fillStyle(BAR_COLOR, 1).fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
  const zoneW = BAR_W * spec.window;
  bar
    .fillStyle(spec.invert ? DANGER_COLOR : ZONE_COLOR, 1)
    .fillRect(BAR_X + (BAR_W - zoneW) / HALF, BAR_Y, zoneW, BAR_H);
  const x = BAR_X + timing.markerAt(spec, t) * BAR_W;
  bar
    .fillStyle(MARKER_COLOR, 1)
    .fillRect(x - MARKER_W / HALF, BAR_Y - MARKER_W, MARKER_W, BAR_H + MARKER_W * HALF);
}

export const timingRunner: RunnerFactory<TimingSpec> = (scene, spec, depth) => {
  const state = timing.fresh();
  scene.add
    .text(GAME_WIDTH / HALF, PROMPT_Y, spec.prompt, textStyle())
    .setOrigin(CENTER)
    .setDepth(depth);
  const bar = scene.add.graphics().setDepth(depth);
  return {
    step: (_time, delta, controls) => {
      state.t += delta;
      draw(bar, spec, state.t);
      if (!controls.pressedAOrTap()) return null;
      const hit = timing.press(spec, state) === "hit";
      scene.cameras.main.flash(FLASH_MS, hit ? 0 : FULL, hit ? FULL : 0, 0, false);
      if (!timing.finished(spec, state)) return null;
      return { won: timing.won(spec, state), score: timing.score(spec, state) };
    },
    status: () => `${state.hits}/${spec.rounds} hits   misses ${state.misses}/${spec.lives}`,
  };
};
