import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, SETTINGS } from "../config";
import { CAMPAIGN } from "@campaign";
import { playMusic } from "../audio/music";
import { takeResumeRequest } from "../hot";
import { Controls } from "../input/controls";
import { setState } from "../registry";
import { loadSave } from "../systems/save";
import { GameState } from "../systems/state";
import { Menu } from "../ui/menu";
import {
  ACCENT_COLOR,
  DIM_COLOR,
  FONT_SIZE_SMALL,
  FONT_SIZE_TITLE,
  PADDING,
  drawWindow,
  textStyle,
} from "../ui/theme";

const HALF = 2;

const CENTER = 0.5;
const TITLE_Y = 128;
const SUBTITLE_Y = 156;
const MENU_X = 270;
const MENU_Y = 212;
const MENU_W = 110;
const MENU_H = 56;
const LOGO_Y = 58;
const ART_SCALE = 2;
const OUTLINE = { stroke: "#000000", strokeThickness: 4 };
const BACKDROP_KEY = CAMPAIGN.title.backdrop;
const LOGO_KEY = CAMPAIGN.title.logo;
const FOOT_MARGIN = 24;
const FOOT_Y = GAME_HEIGHT - FOOT_MARGIN;
const NEW_GAME = 0;

export class TitleScene extends Phaser.Scene {
  private controls!: Controls;
  private menu!: Menu;
  private saved = false;

  constructor() {
    super("title");
  }

  create(): void {
    this.controls = new Controls(this);
    this.saved = loadSave() !== null;
    playMusic(this, CAMPAIGN.title.music);
    this.drawArt();
    const centerX = GAME_WIDTH / HALF;
    this.add
      .text(centerX, TITLE_Y, CAMPAIGN.settings.title, {
        ...textStyle(FONT_SIZE_TITLE, ACCENT_COLOR),
        ...OUTLINE,
      })
      .setOrigin(CENTER);
    this.add
      .text(centerX, SUBTITLE_Y, CAMPAIGN.subtitle, {
        ...textStyle(undefined, ACCENT_COLOR),
        ...OUTLINE,
      })
      .setOrigin(CENTER);
    drawWindow(this.add.graphics(), MENU_X - PADDING, MENU_Y - PADDING, MENU_W + PADDING, MENU_H);
    this.menu = new Menu(this, MENU_X, MENU_Y, ["New Game", "Continue"], [true, this.saved]);
    this.add
      .text(centerX, FOOT_Y, "Tap, click, or Z / Enter to choose", {
        ...textStyle(FONT_SIZE_SMALL, DIM_COLOR),
        ...OUTLINE,
      })
      .setOrigin(CENTER);
    if (takeResumeRequest() && this.saved) {
      this.resume(); // a live update handed over a save: straight back to the map
      return;
    }
    const skip = this.debugChapter();
    if (skip !== null) this.begin(skip);
  }

  private drawArt(): void {
    if (this.textures.exists(BACKDROP_KEY))
      this.add.image(0, 0, BACKDROP_KEY).setOrigin(0).setScale(ART_SCALE);
    if (this.textures.exists(LOGO_KEY)) this.add.image(GAME_WIDTH / HALF, LOGO_Y, LOGO_KEY).setOrigin(CENTER);
  }

  override update(time: number): void {
    this.menu.move(this.controls.menuStep(time));
    const chose = this.menu.tapTo(this.controls.tapped()) || this.controls.pressedA();
    if (!chose || !this.menu.isEnabled) return;
    if (this.menu.selected === NEW_GAME) this.begin(CAMPAIGN.startChapter);
    else this.resume();
  }

  private debugChapter(): string | null {
    if (!SETTINGS.game.debug_chapter_skip) return null;
    const wanted = new URLSearchParams(window.location.search).get("chapter");
    return wanted !== null && wanted in CAMPAIGN.chapters ? wanted : null;
  }

  private begin(chapterId: string): void {
    const chapter = CAMPAIGN.chapters[chapterId];
    if (chapter === undefined) return;
    const state = new GameState();
    state.chapter = chapterId;
    state.setParty(chapter.party);
    setState(this, state);
    this.scene.start("overworld", { map: chapter.start.map, x: chapter.start.x, y: chapter.start.y });
  }

  private resume(): void {
    const data = loadSave();
    if (data === null) return;
    setState(this, GameState.fromSave(data));
    this.scene.start("overworld", { map: data.map, x: data.x, y: data.y });
  }
}
