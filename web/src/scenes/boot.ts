// Loads the sprites and every generated picture listed in art/manifest.json, builds the LPC animations, then goes
// to the title. Music and video are not loaded here; scenes fetch them when they need them.
import Phaser from "phaser";
import { MANIFEST_KEY, MANIFEST_URL, artKey } from "../data/art";
import { FIGURES } from "../data/figures";

export const FRAME = 64;
export const ATLAS_KEY = "atlas";
export const SPARK_KEY = "spark";
const SPARK_SIZE = 4;
const WHITE = 0xffffff;
const WALK_RATE = 10;
const ACT_RATE = 12;

interface AtlasRow {
  row: number;
  frames: number;
}

interface Atlas {
  columns: number;
  rows: Record<string, AtlasRow>;
}

type Manifest = Record<string, readonly { id: string }[]>;

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.load.json(ATLAS_KEY, "assets/sprites/atlas.json");
    for (const id of FIGURES) {
      this.load.spritesheet(id, `assets/sprites/${id}.png`, { frameWidth: FRAME, frameHeight: FRAME });
    }
    this.load.once(`filecomplete-json-${MANIFEST_KEY}`, (_key: string, _type: string, manifest: Manifest) => {
      this.queueArt(manifest);
    });
    this.load.json(MANIFEST_KEY, MANIFEST_URL);
  }

  create(): void {
    const atlas = this.cache.json.get(ATLAS_KEY) as Atlas;
    for (const id of FIGURES) this.buildAnimations(id, atlas);
    this.make
      .graphics({ x: 0, y: 0 }, false)
      .fillStyle(WHITE, 1)
      .fillRect(0, 0, SPARK_SIZE, SPARK_SIZE)
      .generateTexture(SPARK_KEY, SPARK_SIZE, SPARK_SIZE);
    this.scene.start("title");
  }

  private queueArt(manifest: Manifest): void {
    for (const [group, pieces] of Object.entries(manifest)) {
      for (const piece of pieces)
        this.load.image(artKey(group, piece.id), `assets/art/${group}/${piece.id}.png`);
    }
  }

  private buildAnimations(figure: string, atlas: Atlas): void {
    for (const [name, row] of Object.entries(atlas.rows)) {
      const start = row.row * atlas.columns;
      const looping = name.startsWith("walk") || name.startsWith("idle");
      this.anims.create({
        key: `${figure}:${name}`,
        frames: this.anims.generateFrameNumbers(figure, { start, end: start + row.frames - 1 }),
        frameRate: looping ? WALK_RATE : ACT_RATE,
        repeat: looping ? -1 : 0,
      });
    }
  }
}
