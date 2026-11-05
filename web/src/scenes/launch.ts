// Launching a scene on top of another, with the touch overlay kept above everything.
import type Phaser from "phaser";

const TOUCH = "touch";

export function launchOver(from: Phaser.Scene, key: string, data: object): void {
  from.scene.launch(key, data);
  from.scene.bringToTop(key);
  from.scene.bringToTop(TOUCH);
}
