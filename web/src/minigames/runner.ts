// What MinigameScene needs from an engine's drawing side: build once, step every frame, report when done.
import type Phaser from "phaser";
import type { Controls } from "../input/controls";
import type { MinigameResult } from "./types";

export interface Runner {
  /** Advance and draw; a result once the game is decided, otherwise null. */
  step: (time: number, delta: number, controls: Controls) => MinigameResult | null;
  /** One status line under the board. */
  status: () => string;
}

export type RunnerFactory<S> = (scene: Phaser.Scene, spec: S, depth: number) => Runner;
