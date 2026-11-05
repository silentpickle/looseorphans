// An escort guest (FF6 style): an LPC figure that trails the party on the map, a step behind the pet companion. He is
// there while the chapter's `when` holds and gone while `awayWhen` holds (an NPC stands in for him elsewhere).
import type Phaser from "phaser";
import type { Dir, Guest } from "../data/types";
import type { GameState } from "../systems/state";

const GAP = 60; // twice the pet's gap: the pet trots between him and the lead
const EASE = 5; // fraction of the gap closed per second
const MS_PER_S = 1000;
const STILL_PX = 0.5; // moved less than this in a frame: standing
const SCALE = 2;
const ORIGIN_X = 0.5;
const ORIGIN_Y = 0.93;
const BEHIND: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
};

function headingOf(dx: number, dy: number): Dir {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/** True while the guest walks with the party. */
export function guestPresent(guest: Guest, state: GameState): boolean {
  if (!state.check(guest.when)) return false;
  return guest.awayWhen === undefined || !state.check(guest.awayWhen);
}

export class GuestFollower {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private heading: Dir = "down";

  constructor(
    scene: Phaser.Scene,
    private readonly guest: Guest,
    lead: Phaser.GameObjects.Sprite,
  ) {
    this.sprite = scene.add
      .sprite(lead.x - GAP, lead.y, guest.figure)
      .setOrigin(ORIGIN_X, ORIGIN_Y)
      .setScale(SCALE);
    this.sprite.play(`${guest.figure}:idle_down`);
  }

  refresh(state: GameState): void {
    this.sprite.setVisible(guestPresent(this.guest, state));
  }

  follow(lead: Phaser.GameObjects.Sprite, facing: Dir, delta: number): void {
    const behind = BEHIND[facing];
    const tx = lead.x + behind.x * GAP;
    const ty = lead.y + behind.y * GAP;
    const ease = Math.min(1, (delta / MS_PER_S) * EASE);
    const dx = (tx - this.sprite.x) * ease;
    const dy = (ty - this.sprite.y) * ease;
    const walking = Math.abs(dx) + Math.abs(dy) > STILL_PX;
    if (walking) this.heading = headingOf(dx, dy);
    this.sprite.setPosition(this.sprite.x + dx, this.sprite.y + dy);
    this.sprite.setDepth(this.sprite.y);
    this.sprite.play(`${this.guest.figure}:${walking ? "walk" : "idle"}_${this.heading}`, true);
  }
}
