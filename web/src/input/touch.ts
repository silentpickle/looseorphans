// Every press on the canvas, mouse or finger, lands here first. On phones a D-pad (bottom left, only while she is
// free to walk) and A and B (bottom right) are drawn and take the presses that land on them; every other press is a
// tap at a point, which the scenes read through Controls (menus, dialogue, targets, tap-to-walk). Always the top
// scene, and never paused.
import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { setTouch } from "../registry";

export interface TouchState {
  dx: number;
  dy: number;
  aDown: boolean;
  bDown: boolean;
  aPresses: number;
  bPresses: number;
  taps: number; // presses that were not on the overlay
  tapX: number; // where the latest one landed, in game pixels
  tapY: number;
  tapDown: boolean; // that press is still held
}

const PAD_INSET = 80;
const PAD_CENTER_X = PAD_INSET;
const PAD_CENTER_Y = GAME_HEIGHT - PAD_INSET;
const PAD_RADIUS = 64;
const PAD_REACH = 72; // a press inside the drawn ring (and a little past it) steers; further out it is a tap
const PAD_DEAD_ZONE = 12;
const BUTTON_RADIUS = 26;
const BUTTON_NEAR = 50;
const BUTTON_FAR = 110;
const BUTTON_HIGH = 90;
const A_X = GAME_WIDTH - BUTTON_NEAR;
const A_Y = GAME_HEIGHT - BUTTON_HIGH;
const B_X = GAME_WIDTH - BUTTON_FAR;
const B_Y = GAME_HEIGHT - BUTTON_NEAR;
const RING_WIDTH = 2;
const LABEL_STYLE = { fontSize: "18px" };
const CENTER = 0.5;
const OVERLAY_ALPHA = 0.28;
const OVERLAY_COLOR = 0xffffff;
const EXTRA_POINTERS = 2;
const DEPTH = 1000;
const WALK_SCENE = "overworld";
const OVER_WALK = ["dialogue", "battle", "cutscene", "minigame"] as const; // while one runs, nobody walks

export function hasTouch(): boolean {
  return navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export class TouchScene extends Phaser.Scene {
  private readonly state: TouchState = {
    dx: 0,
    dy: 0,
    aDown: false,
    bDown: false,
    aPresses: 0,
    bPresses: 0,
    taps: 0,
    tapX: 0,
    tapY: 0,
    tapDown: false,
  };
  private overlay = false;
  private pad: Phaser.GameObjects.Graphics | null = null;
  private padPointer: number | null = null;
  private tapPointer: number | null = null;

  constructor() {
    super({ key: "touch", active: true });
  }

  create(): void {
    setTouch(this, this.state);
    this.overlay = hasTouch();
    if (this.overlay) {
      this.input.addPointer(EXTRA_POINTERS);
      this.drawOverlay();
    }
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      this.press(p);
    });
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      this.drag(p);
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      this.release(p);
    });
  }

  override update(): void {
    this.stayOnTop();
    const live = this.padLive();
    this.pad?.setVisible(live);
    if (!live && this.padPointer !== null) this.letGoOfPad();
  }

  /** A scene started after this one (Continue straight to the map) would otherwise cover the buttons. */
  private stayOnTop(): void {
    const last = this.game.scene.getScenes(false).length - 1;
    if (this.scene.getIndex() < last) this.scene.bringToTop();
  }

  /** The D-pad only works, and only shows, while she is on the map with nothing over it. */
  private padLive(): boolean {
    if (!this.overlay || !this.scene.isActive(WALK_SCENE)) return false;
    return !OVER_WALK.some((key) => this.scene.isActive(key));
  }

  private drawOverlay(): void {
    const pad = this.add.graphics().setDepth(DEPTH).setAlpha(OVERLAY_ALPHA);
    pad.lineStyle(RING_WIDTH, OVERLAY_COLOR, 1);
    pad.strokeCircle(PAD_CENTER_X, PAD_CENTER_Y, PAD_RADIUS);
    pad.fillStyle(OVERLAY_COLOR, 1);
    pad.fillCircle(PAD_CENTER_X, PAD_CENTER_Y, PAD_DEAD_ZONE);
    this.pad = pad.setVisible(false);
    const buttons = this.add.graphics().setDepth(DEPTH).setAlpha(OVERLAY_ALPHA);
    buttons.lineStyle(RING_WIDTH, OVERLAY_COLOR, 1);
    buttons.strokeCircle(A_X, A_Y, BUTTON_RADIUS);
    buttons.strokeCircle(B_X, B_Y, BUTTON_RADIUS);
    this.add.text(A_X, A_Y, "A", LABEL_STYLE).setOrigin(CENTER).setDepth(DEPTH).setAlpha(OVERLAY_ALPHA);
    this.add.text(B_X, B_Y, "B", LABEL_STYLE).setOrigin(CENTER).setDepth(DEPTH).setAlpha(OVERLAY_ALPHA);
  }

  private press(p: Phaser.Input.Pointer): void {
    if (this.pressButton(p)) return;
    if (this.padLive() && distance(p.x, p.y, PAD_CENTER_X, PAD_CENTER_Y) <= PAD_REACH) {
      this.padPointer = p.id;
      this.drag(p);
      return;
    }
    this.tapPointer = p.id;
    this.state.tapX = p.x;
    this.state.tapY = p.y;
    this.state.tapDown = true;
    this.state.taps += 1;
  }

  /** A or B, when the overlay is drawn and the press is on one. */
  private pressButton(p: Phaser.Input.Pointer): boolean {
    if (!this.overlay) return false;
    if (distance(p.x, p.y, A_X, A_Y) <= BUTTON_RADIUS) {
      this.state.aDown = true;
      this.state.aPresses += 1;
      return true;
    }
    if (distance(p.x, p.y, B_X, B_Y) <= BUTTON_RADIUS) {
      this.state.bDown = true;
      this.state.bPresses += 1;
      return true;
    }
    return false;
  }

  private drag(p: Phaser.Input.Pointer): void {
    if (p.id !== this.padPointer) return;
    const dx = p.x - PAD_CENTER_X;
    const dy = p.y - PAD_CENTER_Y;
    const far = Math.hypot(dx, dy);
    if (far < PAD_DEAD_ZONE) {
      this.state.dx = 0;
      this.state.dy = 0;
      return;
    }
    this.state.dx = dx / far;
    this.state.dy = dy / far;
  }

  private release(p: Phaser.Input.Pointer): void {
    if (p.id === this.padPointer) this.letGoOfPad();
    if (p.id === this.tapPointer) {
      this.tapPointer = null;
      this.state.tapDown = false;
    }
    this.state.aDown = false;
    this.state.bDown = false;
  }

  private letGoOfPad(): void {
    this.padPointer = null;
    this.state.dx = 0;
    this.state.dy = 0;
  }
}
