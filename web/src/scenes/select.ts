// Choose an adventure. Shown after boot when the build has more than one and the address doesn't name one. The
// adventure already loaded goes straight to its title; another one reloads the page with `?adventure=<id>`, so every
// table built at import time is built for it (campaigns/active.ts).
import Phaser from "phaser";
import { CAMPAIGN } from "@campaign";
import { ADVENTURE_PARAM, rememberAdventure } from "../campaigns/active";
import { ADVENTURES } from "../campaigns/index";
import type { Adventure } from "../campaigns/index";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { Controls } from "../input/controls";
import { storage } from "../systems/storage";
import { Menu } from "../ui/menu";
import {
  ACCENT_COLOR,
  DIM_COLOR,
  FONT_SIZE_SMALL,
  LINE_HEIGHT,
  PADDING,
  drawWindow,
  textStyle,
} from "../ui/theme";

const HALF = 2;
const CENTER = 0.5;
const ART_SCALE = 2;
const HEADER_Y = 28;
const LIST_X = 40;
const LIST_Y = 80;
const LIST_W = 250;
const BLURB_X = 320;
const BLURB_Y = 80;
const BLURB_W = 280;
const BLURB_H = 150;
const BLURB_GAP = 8;
const FOOT_MARGIN = 24;
const OUTLINE = { stroke: "#000000", strokeThickness: 4 };
const ART_DIM = 0.45;
const BLACK = 0x000000;

/** True when this adventure has a saved game on this device. */
function hasSave(adventure: Adventure): boolean {
  const store = storage();
  return store !== null && store.getItem(adventure.campaign.saveKey) !== null;
}

/** The address with this adventure named in it (other parameters, like ?qa=1, kept). */
function addressFor(id: string): URL {
  const url = new URL(window.location.href);
  url.searchParams.set(ADVENTURE_PARAM, id);
  return url;
}

export class SelectScene extends Phaser.Scene {
  private controls!: Controls;
  private menu!: Menu;
  private art: Phaser.GameObjects.Image | null = null;
  private blurb!: Phaser.GameObjects.Text;
  private saveNote!: Phaser.GameObjects.Text;
  private shown = -1;

  constructor() {
    super("select");
  }

  create(): void {
    this.controls = new Controls(this);
    this.shown = -1;
    this.art = null;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, BLACK).setOrigin(0);
    this.add
      .text(GAME_WIDTH / HALF, HEADER_Y, "Choose an adventure", {
        ...textStyle(undefined, ACCENT_COLOR),
        ...OUTLINE,
      })
      .setOrigin(CENTER)
      .setDepth(1);
    this.drawList();
    this.drawBlurb();
    this.add
      .text(GAME_WIDTH / HALF, GAME_HEIGHT - FOOT_MARGIN, "Tap, click, or Z / Enter to choose", {
        ...textStyle(FONT_SIZE_SMALL, DIM_COLOR),
        ...OUTLINE,
      })
      .setOrigin(CENTER)
      .setDepth(1);
    const here = ADVENTURES.findIndex((adventure) => adventure.campaign.id === CAMPAIGN.id);
    this.menu.move(Math.max(0, here));
    this.show();
  }

  private drawList(): void {
    const height = ADVENTURES.length * LINE_HEIGHT + PADDING;
    drawWindow(this.add.graphics().setDepth(1), LIST_X - PADDING, LIST_Y - PADDING, LIST_W, height + PADDING);
    const titles = ADVENTURES.map((adventure) => adventure.campaign.settings.title);
    this.menu = new Menu(this, LIST_X, LIST_Y, titles, undefined, 1);
  }

  private drawBlurb(): void {
    drawWindow(
      this.add.graphics().setDepth(1),
      BLURB_X - PADDING,
      BLURB_Y - PADDING,
      BLURB_W + PADDING,
      BLURB_H,
    );
    const width = BLURB_W - PADDING;
    this.blurb = this.add.text(BLURB_X, BLURB_Y, "", { ...textStyle(), wordWrap: { width } }).setDepth(1);
    this.saveNote = this.add.text(BLURB_X, BLURB_Y, "", textStyle(FONT_SIZE_SMALL, ACCENT_COLOR)).setDepth(1);
  }

  /** Redraw the art and the blurb for the highlighted adventure. */
  private show(): void {
    const adventure = ADVENTURES[this.menu.selected];
    if (adventure === undefined || this.shown === this.menu.selected) return;
    this.shown = this.menu.selected;
    this.art?.destroy();
    this.art = null;
    if (this.textures.exists(adventure.card))
      this.art = this.add.image(0, 0, adventure.card).setOrigin(0).setScale(ART_SCALE).setAlpha(ART_DIM);
    this.blurb.setText([adventure.campaign.subtitle, "", adventure.blurb]);
    this.saveNote.setY(this.blurb.y + this.blurb.height + BLURB_GAP);
    this.saveNote.setText(hasSave(adventure) ? "Saved game on this device" : "");
  }

  override update(time: number): void {
    this.menu.move(this.controls.menuStep(time));
    const chose = this.menu.tapTo(this.controls.tapped()) || this.controls.pressedA();
    this.show();
    if (!chose) return;
    const adventure = ADVENTURES[this.menu.selected];
    if (adventure !== undefined) this.choose(adventure.campaign.id);
  }

  private choose(id: string): void {
    rememberAdventure(id);
    const address = addressFor(id);
    if (id !== CAMPAIGN.id) {
      window.location.assign(address);
      return;
    }
    window.history.replaceState(null, "", address); // a live reload keeps playing this one
    this.scene.start("title");
  }
}
