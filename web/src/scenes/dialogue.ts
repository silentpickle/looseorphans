// The talk box: speaker, portrait, typewriter text, choices. Runs on top of whatever launched it and hands back
// the first action it meets (or nothing at the end of the list).
import Phaser from "phaser";
import { portraitFor } from "../data/art";
import { endingFor } from "../systems/meter";
import type { Action, Node } from "../data/types";
import { Controls } from "../input/controls";
import { getState } from "../registry";
import { CURSOR_GAP, Menu } from "../ui/menu";
import { ACCENT_COLOR, LINE_HEIGHT, PADDING, drawWindow, textStyle } from "../ui/theme";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const SIDES = 2;

export interface DialogueData {
  nodes: readonly Node[];
  onDone: (action: Action | undefined) => void;
}

const BOX_HEIGHT = 104;
const BOX_MARGIN = 6;
const BOX_Y = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN;
const PORTRAIT_SIZE = 96;
const PORTRAIT_GAP = 8;
const NAME_OFFSET_Y = -22;
const CHARS_PER_SECOND = 55;
const MS_PER_S = 1000;
const CHOICE_MIN_WIDTH = 230;
const CHOICE_MAX_WIDTH = GAME_WIDTH - BOX_MARGIN * SIDES;
const CHOICE_GAP = 60;
const CHOICE_Y = BOX_Y - CHOICE_GAP;
const DEPTH = 500;
const NAME_OUTLINE = { stroke: "#000000", strokeThickness: 4 }; // the name sits over the map, not in the box

export class DialogueScene extends Phaser.Scene {
  private payload!: DialogueData;
  private controls!: Controls;
  private index = 0;
  private text!: Phaser.GameObjects.Text;
  private name!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;
  private choiceBox!: Phaser.GameObjects.Graphics;
  private menu: Menu | null = null;
  private full = "";
  private shown = 0;

  constructor() {
    super("dialogue");
  }

  init(data: DialogueData): void {
    this.payload = data;
    this.index = 0;
    this.menu = null;
  }

  create(): void {
    this.controls = new Controls(this);
    const box = this.add.graphics().setDepth(DEPTH);
    drawWindow(box, BOX_MARGIN, BOX_Y, GAME_WIDTH - BOX_MARGIN * SIDES, BOX_HEIGHT);
    this.portrait = this.add
      .image(BOX_MARGIN + PADDING, BOX_Y + BOX_HEIGHT - PADDING, "")
      .setOrigin(0, 1)
      .setDepth(DEPTH + 1)
      .setVisible(false);
    this.name = this.add
      .text(BOX_MARGIN + PADDING, BOX_Y + NAME_OFFSET_Y, "", {
        ...textStyle(undefined, ACCENT_COLOR),
        ...NAME_OUTLINE,
      })
      .setDepth(DEPTH + 1);
    this.text = this.add.text(0, BOX_Y + PADDING, "", textStyle()).setDepth(DEPTH + 1);
    this.choiceBox = this.add.graphics().setDepth(DEPTH);
    this.show();
  }

  override update(time: number, delta: number): void {
    this.reveal(delta);
    if (this.menu !== null) {
      this.menu.move(this.controls.menuStep(time));
      if (this.menu.tapTo(this.controls.tapped()) || this.controls.pressedA()) this.choose();
      return;
    }
    if (!this.controls.pressedAOrTap()) return;
    if (this.shown < this.full.length) {
      this.complete();
      return;
    }
    this.advance();
  }

  private node(): Node | undefined {
    return this.payload.nodes[this.index];
  }

  private show(): void {
    const node = this.node();
    if (node === undefined) {
      this.finish(undefined);
      return;
    }
    this.layoutPortrait(node.portrait ?? portraitFor(node.speaker));
    this.name.setText(node.speaker ?? "");
    this.full = node.text;
    this.shown = 0;
    this.text.setText("");
    this.applyEffects(node);
  }

  private layoutPortrait(key: string | undefined): void {
    const hasPortrait = key !== undefined && this.textures.exists(key);
    this.portrait.setVisible(hasPortrait);
    if (hasPortrait) this.portrait.setTexture(key).setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE);
    const left = BOX_MARGIN + PADDING + (hasPortrait ? PORTRAIT_SIZE + PORTRAIT_GAP : 0);
    this.text.setPosition(left, BOX_Y + PADDING);
    this.text.setWordWrapWidth(GAME_WIDTH - left - BOX_MARGIN - PADDING);
  }

  private applyEffects(node: Node): void {
    const state = getState(this);
    if (node.set !== undefined) state.set(node.set);
    if (node.meter !== undefined) state.addMeter(node.meter);
  }

  private reveal(delta: number): void {
    if (this.shown >= this.full.length) return;
    this.shown = Math.min(this.full.length, this.shown + (delta / MS_PER_S) * CHARS_PER_SECOND);
    this.text.setText(this.full.slice(0, Math.floor(this.shown)));
    if (this.shown >= this.full.length) this.openChoices();
  }

  /** Skip the typewriter: the whole line at once, and its choices if it has any. */
  private complete(): void {
    this.shown = this.full.length;
    this.text.setText(this.full);
    this.openChoices();
  }

  private openChoices(): void {
    const node = this.node();
    if (node?.choices === undefined || this.menu !== null) return;
    const labels = node.choices.map((choice) => choice.text);
    const width = this.choiceWidth(labels);
    const height = labels.length * LINE_HEIGHT + PADDING * SIDES;
    const x = GAME_WIDTH - BOX_MARGIN - width;
    drawWindow(this.choiceBox, x, CHOICE_Y - height, width, height);
    this.menu = new Menu(this, x + PADDING, CHOICE_Y - height + PADDING, labels, undefined, DEPTH + 1);
  }

  /** Wide enough for the longest choice (a window that hugs the right edge, never past the screen). */
  private choiceWidth(labels: readonly string[]): number {
    const probe = this.add.text(0, 0, "", textStyle()).setVisible(false);
    const widest = Math.max(...labels.map((label) => probe.setText(label).width));
    probe.destroy();
    const needed = Math.ceil(widest) + CURSOR_GAP + PADDING * SIDES;
    return Math.min(CHOICE_MAX_WIDTH, Math.max(CHOICE_MIN_WIDTH, needed));
  }

  private choose(): void {
    const node = this.node();
    const choice = node?.choices?.[this.menu?.selected ?? 0];
    this.menu?.destroy();
    this.menu = null;
    this.choiceBox.clear();
    if (choice === undefined) return;
    const state = getState(this);
    if (choice.set !== undefined) state.set(choice.set);
    if (choice.meter !== undefined) state.addMeter(choice.meter);
    this.goTo(choice.next);
  }

  private advance(): void {
    const node = this.node();
    if (node === undefined) return;
    if (node.choices !== undefined) {
      this.openChoices(); // a choice line only moves on through a choice
      return;
    }
    if (node.ending !== undefined) {
      this.goTo(endingFor(getState(this).meter) === "A" ? node.ending.A : node.ending.B);
      return;
    }
    if (node.action !== undefined) {
      this.finish(node.action);
      return;
    }
    if (node.next !== undefined) {
      this.goTo(node.next);
      return;
    }
    this.index += 1;
    this.show();
  }

  private goTo(id: string): void {
    const at = this.payload.nodes.findIndex((node) => node.id === id);
    this.index = at < 0 ? this.payload.nodes.length : at;
    this.show();
  }

  private finish(action: Action | undefined): void {
    const done = this.payload.onDone;
    this.scene.stop();
    done(action);
  }
}
