// The K-drama trope moment: letterbox, a slow zoom on a still, sparkles, captions one at a time, and the Drama
// Album stamp. Hamfisted on purpose.
import Phaser from "phaser";
import { CAMPAIGN } from "@campaign";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { playMusic } from "../audio/music";
import { Controls } from "../input/controls";
import { getState } from "../registry";
import { SPARK_KEY } from "./boot";
import { ACCENT_COLOR, DIM_COLOR, FONT_SIZE_SMALL, FONT_SIZE_TITLE, textStyle } from "../ui/theme";

const HALF = 2;

export interface CutsceneData {
  title: string;
  caption: readonly string[];
  still?: string | undefined;
  video?: string | undefined; // assets/video/<id>.mp4, muted, looped under the captions
  onDone: () => void;
}

const BAR_HEIGHT = 48;
const BAR_MS = 700;
const ZOOM_FROM = 1;
const ZOOM_TO = 1.18;
const ZOOM_MS = 9000;
const TITLE_Y = 70;
const CAPTION_LIFT = 40;
const STAMP_LIFT = 16;
const CAPTION_Y = GAME_HEIGHT - BAR_HEIGHT - CAPTION_LIFT;
const STAMP_Y = GAME_HEIGHT - BAR_HEIGHT - STAMP_LIFT;
const DEPTH_TEXT = 602;
const CENTER = 0.5;
const SPARK_RATE = 40;
const SPARK_LIFE = 1600;
const SPARK_SPEED = 30;
const SPARK_ALPHA = 0.9;
const BACKDROP_SCALE = 2;
const FALLBACK_COLOR = 0x2a1b3d;
const DEPTH = 600;
const OUTLINE = { stroke: "#000000", strokeThickness: 4 }; // readable over a bright clip
const VIDEO_DEPTH = 600.5; // over the still, under the letterbox
const SWELL_MUSIC = "ost_swell";
const VIDEO_FORMATS = ["mp4"] as const; // H.264 plays everywhere, iPhones included
const NO_AUDIO = true;

export class CutsceneScene extends Phaser.Scene {
  private payload!: CutsceneData;
  private controls!: Controls;
  private caption!: Phaser.GameObjects.Text;
  private line = 0;
  private closing = false;

  constructor() {
    super("cutscene");
  }

  init(data: CutsceneData): void {
    this.payload = data;
    this.line = 0;
    this.closing = false;
  }

  create(): void {
    this.controls = new Controls(this);
    this.still();
    this.loadVideo();
    playMusic(this, SWELL_MUSIC, false);
    this.letterbox();
    this.sparkles();
    this.add
      .text(GAME_WIDTH / HALF, TITLE_Y, this.payload.title, {
        ...textStyle(FONT_SIZE_TITLE, ACCENT_COLOR),
        ...OUTLINE,
        fontStyle: "italic",
      })
      .setOrigin(CENTER)
      .setDepth(DEPTH_TEXT);
    this.caption = this.add
      .text(GAME_WIDTH / HALF, CAPTION_Y, "", { ...textStyle(), ...OUTLINE, align: "center" })
      .setOrigin(CENTER)
      .setDepth(DEPTH_TEXT);
    const meter = getState(this).meter;
    this.add
      .text(GAME_WIDTH / HALF, STAMP_Y, CAMPAIGN.meter.stamp(meter), textStyle(FONT_SIZE_SMALL, DIM_COLOR))
      .setOrigin(CENTER)
      .setDepth(DEPTH_TEXT);
    this.showLine();
  }

  override update(): void {
    if (this.closing || !this.controls.pressedAOrTap()) return;
    this.line += 1;
    if (this.line < this.payload.caption.length) {
      this.showLine();
      return;
    }
    this.close();
  }

  private still(): void {
    const key = this.payload.still;
    const hasStill = key !== undefined && this.textures.exists(key);
    const image = hasStill
      ? this.add.image(GAME_WIDTH / HALF, GAME_HEIGHT / HALF, key).setScale(BACKDROP_SCALE)
      : this.add.rectangle(GAME_WIDTH / HALF, GAME_HEIGHT / HALF, GAME_WIDTH, GAME_HEIGHT, FALLBACK_COLOR);
    image.setDepth(DEPTH);
    this.tweens.add({
      targets: image,
      scale: image.scale * (ZOOM_TO / ZOOM_FROM),
      duration: ZOOM_MS,
      ease: "Sine.easeInOut",
    });
  }

  private loadVideo(): void {
    const id = this.payload.video;
    if (id === undefined) return;
    const key = `video_${id}`;
    if (this.cache.video.exists(key)) {
      this.showVideo(key);
      return;
    }
    this.load.video(
      key,
      VIDEO_FORMATS.map((format) => `assets/video/${id}.${format}`),
      NO_AUDIO,
    );
    this.load.once(`filecomplete-video-${key}`, () => {
      this.showVideo(key);
    });
    this.load.start();
  }

  /** The clip plays over the still; if it never loads or plays, the still and its slow zoom are the scene. */
  private showVideo(key: string): void {
    if (this.closing) return;
    const video = this.add.video(GAME_WIDTH / HALF, GAME_HEIGHT / HALF, key).setDepth(VIDEO_DEPTH);
    video.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    video.play(true);
  }

  private letterbox(): void {
    const top = this.add
      .rectangle(0, 0, GAME_WIDTH, BAR_HEIGHT, 0x000000)
      .setOrigin(0, 1)
      .setDepth(DEPTH + 1);
    const bottom = this.add
      .rectangle(0, GAME_HEIGHT, GAME_WIDTH, BAR_HEIGHT, 0x000000)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 1);
    this.tweens.add({ targets: top, y: BAR_HEIGHT, duration: BAR_MS, ease: "Quad.easeOut" });
    this.tweens.add({ targets: bottom, y: GAME_HEIGHT - BAR_HEIGHT, duration: BAR_MS, ease: "Quad.easeOut" });
  }

  private sparkles(): void {
    this.add
      .particles(0, 0, SPARK_KEY, {
        x: { min: 0, max: GAME_WIDTH },
        y: { min: BAR_HEIGHT, max: GAME_HEIGHT - BAR_HEIGHT },
        lifespan: SPARK_LIFE,
        speedY: { min: -SPARK_SPEED, max: 0 },
        alpha: { start: SPARK_ALPHA, end: 0 },
        frequency: SPARK_RATE,
        tint: 0xffd166,
      })
      .setDepth(DEPTH + 1);
  }

  private showLine(): void {
    this.caption.setText(this.payload.caption[this.line] ?? "");
  }

  private close(): void {
    this.closing = true;
    this.cameras.main.fadeOut(BAR_MS, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const done = this.payload.onDone;
      this.scene.stop();
      done();
    });
  }
}
