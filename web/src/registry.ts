// The one place a scene fetches shared objects from Phaser's untyped registry.
import type Phaser from "phaser";
import type { TouchState } from "./input/touch";
import type { GameState } from "./systems/state";

const STATE_KEY = "state";
const TOUCH_KEY = "touch";

export function getState(scene: Phaser.Scene): GameState {
  return scene.registry.get(STATE_KEY) as GameState;
}

export function setState(scene: Phaser.Scene, state: GameState): void {
  scene.registry.set(STATE_KEY, state);
}

export function getTouch(scene: Phaser.Scene): TouchState {
  return scene.registry.get(TOUCH_KEY) as TouchState;
}

export function setTouch(scene: Phaser.Scene, touch: TouchState): void {
  scene.registry.set(TOUCH_KEY, touch);
}
