// One input surface for every scene: keyboard (arrows/WASD, Z/Enter/Space = A, X/Esc = B), the touch overlay, and
// taps (a mouse click or a finger anywhere off the overlay).
import Phaser from "phaser";
import type { Dir } from "../data/types";
import { getTouch } from "../registry";

interface Axis {
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

const KEYS = {
  up: "UP",
  down: "DOWN",
  left: "LEFT",
  right: "RIGHT",
  w: "W",
  a: "A",
  s: "S",
  d: "D",
  z: "Z",
  enter: "ENTER",
  space: "SPACE",
  x: "X",
  esc: "ESC",
} as const;

type KeyMap = Record<keyof typeof KEYS, Phaser.Input.Keyboard.Key>;
const REPEAT_DELAY_MS = 180;
const AXIS_THRESHOLD = 0.4;

export class Controls {
  private readonly keys: KeyMap;
  private readonly scene: Phaser.Scene;
  private seenA: number;
  private seenB: number;
  private seenTaps: number;
  private lastMenuMoveAt = 0;
  private stickWasNeutral = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.keys = scene.input.keyboard?.addKeys(KEYS) as KeyMap;
    const touch = getTouch(scene);
    this.seenA = touch.aPresses;
    this.seenB = touch.bPresses;
    this.seenTaps = touch.taps;
  }

  /** Forget presses made while another scene had the player's attention (closing a dialogue must not re-open it). */
  reset(): void {
    this.scene.input.keyboard?.resetKeys();
    const touch = getTouch(this.scene);
    this.seenA = touch.aPresses;
    this.seenB = touch.bPresses;
    this.seenTaps = touch.taps;
  }

  axis(): Axis {
    const touch = getTouch(this.scene);
    const x =
      Number(this.keys.right.isDown || this.keys.d.isDown) -
      Number(this.keys.left.isDown || this.keys.a.isDown);
    const y =
      Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown);
    if (x !== 0 || y !== 0) return { x, y };
    return { x: touch.dx, y: touch.dy };
  }

  pressedA(): boolean {
    const touch = getTouch(this.scene);
    const fromTouch = touch.aPresses > this.seenA;
    this.seenA = touch.aPresses;
    const { z, enter, space } = this.keys;
    return fromTouch || [z, enter, space].some((key) => Phaser.Input.Keyboard.JustDown(key));
  }

  /** A held down right now (keyboard, touch button, or a held click or finger), for hold-to-speed-up. */
  heldA(): boolean {
    const { z, enter, space } = this.keys;
    const touch = getTouch(this.scene);
    return touch.aDown || touch.tapDown || [z, enter, space].some((key) => key.isDown);
  }

  /** Where a tap or click landed since the last ask, or null. */
  tapped(): Point | null {
    const touch = getTouch(this.scene);
    if (touch.taps === this.seenTaps) return null;
    this.seenTaps = touch.taps;
    return { x: touch.tapX, y: touch.tapY };
  }

  /** A, or a tap anywhere: for screens where the only thing to do is go on. */
  pressedAOrTap(): boolean {
    const tap = this.tapped() !== null;
    return this.pressedA() || tap;
  }

  pressedB(): boolean {
    const touch = getTouch(this.scene);
    const fromTouch = touch.bPresses > this.seenB;
    this.seenB = touch.bPresses;
    const { x, esc } = this.keys;
    return fromTouch || [x, esc].some((key) => Phaser.Input.Keyboard.JustDown(key));
  }

  /** -1, 0 or 1 for menus: a fresh key press, or a held stick with a repeat delay. */
  menuStep(now: number): number {
    const { up, down, w, s } = this.keys;
    const tapped = this.tap([up, w], [down, s], now);
    if (tapped !== 0) return tapped;
    return this.repeat(this.axis().y, now);
  }

  /** -1, 0 or 1 sideways, for target cursors. */
  menuSide(now: number): number {
    const { left, right, a, d } = this.keys;
    const tapped = this.tap([left, a], [right, d], now);
    if (tapped !== 0) return tapped;
    return this.repeat(this.axis().x, now);
  }

  /** A fresh press: -1 or 1. It also starts the repeat clock, so the same press is not counted again as a hold. */
  private tap(back: Phaser.Input.Keyboard.Key[], forward: Phaser.Input.Keyboard.Key[], now: number): number {
    const justDown = (keys: Phaser.Input.Keyboard.Key[]): boolean =>
      keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const step = justDown(back) ? -1 : justDown(forward) ? 1 : 0;
    if (step !== 0) this.lastMenuMoveAt = now;
    return step;
  }

  /** A held direction (keyboard or touch stick) steps once per repeat delay. */
  private repeat(value: number, now: number): number {
    if (Math.abs(value) < AXIS_THRESHOLD || now - this.lastMenuMoveAt < REPEAT_DELAY_MS) return 0;
    this.lastMenuMoveAt = now;
    return Math.sign(value);
  }

  /** A direction pressed this frame: a key tap, or the touch stick pushed out of neutral. */
  pressedDir(): Dir | null {
    const { up, down, left, right, w, a, s, d } = this.keys;
    const taps: [Dir, Phaser.Input.Keyboard.Key[]][] = [
      ["up", [up, w]],
      ["down", [down, s]],
      ["left", [left, a]],
      ["right", [right, d]],
    ];
    const tapped = taps.find(([, keys]) => keys.some((key) => Phaser.Input.Keyboard.JustDown(key)));
    if (tapped !== undefined) return tapped[0];
    return this.stickFlick();
  }

  private stickFlick(): Dir | null {
    const touch = getTouch(this.scene);
    const neutral = Math.hypot(touch.dx, touch.dy) < AXIS_THRESHOLD;
    const flicked = this.stickWasNeutral && !neutral;
    this.stickWasNeutral = neutral;
    if (!flicked) return null;
    if (Math.abs(touch.dx) > Math.abs(touch.dy)) return touch.dx > 0 ? "right" : "left";
    return touch.dy > 0 ? "down" : "up";
  }
}
