// Side-view ATB battle: enemies left, party right, FF-blue windows below. The rules live in systems/battle.ts,
// systems/status.ts and systems/encore.ts; this scene only asks them and animates the answer.
import Phaser from "phaser";
import { CAMPAIGN } from "@campaign";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { ENCORES } from "../data/encores";
import { figureFor } from "../data/figures";
import { ENEMIES } from "../data/enemies";
import { ITEMS } from "../data/items";
import { MEMBERS } from "../data/members";
import { SKILLS } from "../data/skills";
import type { Item, MemberId, School, Skill } from "../data/types";
import { FORECAST_CYCLE, WEATHER } from "../data/weather";
import type { Weather, WeatherId } from "../data/weather";
import { playMusic } from "../audio/music";
import { Controls } from "../input/controls";
import type { Point } from "../input/controls";
import { getState } from "../registry";
import * as rules from "../systems/battle";
import type { Combatant } from "../systems/battle";
import { performEncore } from "../systems/encore";
import { enemySlot } from "../systems/layout";
import type { Slot } from "../systems/layout";
import type { EncoreEvent } from "../systems/encore";
import { encoreCharge, foeDamage, foeHp } from "../systems/difficulty";
import * as status from "../systems/status";
import { Menu } from "../ui/menu";
import {
  ACCENT_COLOR,
  CURSOR,
  DIM_COLOR,
  FONT_SIZE_SMALL,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  PADDING,
  drawWindow,
  textStyle,
} from "../ui/theme";

export type BattleOutcome = "won" | "lost";

export interface BattleData {
  enemies: readonly string[];
  scripted?: "lose" | undefined;
  weather?: WeatherId | undefined;
  forecast?: boolean | undefined; // the weather changes on every enemy turn
  background?: string | undefined; // art/battles id
  music?: string | undefined; // defaults to the battle theme
  onDone: (outcome: BattleOutcome) => void;
}

type Phase = "tick" | "command" | "sub" | "target" | "acting" | "over";
type Command = "attack" | "skill" | "item" | "encore";

interface Plan {
  command: Command;
  skill?: Skill;
  item?: Item;
}

interface View {
  body: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.Text;
}

const BASE_COMMANDS: readonly Command[] = ["attack", "skill", "item"];
const COMMAND_LABELS: Record<Command, string> = {
  attack: "Attack",
  skill: "Skill",
  item: "Item",
  encore: "ENCORE!",
};
const HALF = 2;
const CENTER = 0.5;
const BACKGROUND = 0x101830;
const FLOOR_COLOR = 0x0a0f22;
const FLOOR_Y = 240;
const PARTY_X = 480;
const PARTY_STAGGER = 30; // a diagonal line, FF6 style
const PARTY_Y0 = 170; // feet on the painted floor; four members end just above the status window
const PARTY_SPACING = 26;
const FIGURE_SCALE = 2;
const FIGURE_ORIGIN_Y = 0.93;
const EDGE = 6;
const STATUS_X = 230;
const STATUS_Y = 250;
const STATUS_W = GAME_WIDTH - STATUS_X - EDGE;
const STATUS_H = GAME_HEIGHT - STATUS_Y - EDGE;
const COMMAND_X = 6;
const COMMAND_W = 218;
const MESSAGE_Y = 8;
const MESSAGE_H = 30;
const MESSAGE_PAD_Y = 7;
const WEATHER_WIDTH = 120;
const WEATHER_X = GAME_WIDTH - WEATHER_WIDTH;
const ROW_SPACING = 23; // four party rows fit inside the status window
const HP_COLUMN = 104;
const MP_COLUMN = 184;
const TAG_COLUMN = 250;
const TEXTS_PER_ROW = 4;
const HP_SLOT = 1;
const MP_SLOT = 2;
const TAG_SLOT = 3;
const GAUGE_X = 300;
const GAUGE_W = 90;
const GAUGE_H = 4;
const GAUGE_LIFT = 4;
const ENCORE_LIFT = 10;
const GAUGE_COLOR = 0x59d1ff;
const ENCORE_COLOR = 0xffd166;
const GAUGE_BACK = 0x223355;
const OUTLINE = 0xffffff;
const OUTLINE_WIDTH = 2;
const LABEL_GAP = 4;
const SPRITE_QUARTER = 4;
const LUNGE_PX = 28;
const LUNGE_MS = 140;
const HIT_FLASH_MS = 120;
const FLOAT_MS = 700;
const FLOAT_RISE = 30;
const ACT_MS = 650;
const BANNER_MS = 1100;
const EVENT_GAP_MS = 220;
const END_MS = 1400;
const DEAD_ALPHA = 0.35;
const HURT_TINT = 0xff6666;
const HEAL_COLOR = "#7dffb0";
const STATUS_COLOR = "#ffb3ff";
const DEPTH_UI = 10;
const DEPTH_FLOAT = 12;
const DEPTH_BANNER = 14;
const SUMMON_SIZE = 96;
const BANNER_OUTLINE = { stroke: "#000000", strokeThickness: 4 };
const STEAL_ITEM = "banana_milk";
const BACKGROUND_SCALE = 2;
const BOSS_PREFIX = "boss_";
const BOSS_SCALE = 1.25;
const ENEMY_SCALE = 1.5;
const DEFAULT_MUSIC = "battle";
const VICTORY_MUSIC = "victory";
const TARGET_REACH = 64; // a tap this close to someone's middle picks them
const FIGURE_MIDDLE = 0.35; // a figure's middle sits this share of its height above its feet

const TAGS: Record<status.StatusId, string> = {
  stun: "STN",
  panic: "PNC",
  charm: "CHM",
  shield: "SHD",
  haste: "HST",
  roasted: "RST",
};

export class BattleScene extends Phaser.Scene {
  private payload!: BattleData;
  private controls!: Controls;
  private all: Combatant[] = [];
  private views = new Map<string, View>();
  private phase: Phase = "tick";
  private actor: Combatant | null = null;
  private menu: Menu | null = null;
  private commands: Command[] = [];
  private plan: Plan = { command: "attack" };
  private targets: Combatant[] = [];
  private targetIndex = 0;
  private weather: Weather = WEATHER.clear;
  private forecastIndex = 0;
  private cursor!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private weatherText!: Phaser.GameObjects.Text;
  private statusTexts: Phaser.GameObjects.Text[] = [];
  private gauges!: Phaser.GameObjects.Graphics;
  private commandBox!: Phaser.GameObjects.Graphics;
  private subOptions: string[] = [];

  constructor() {
    super("battle");
  }

  init(data: BattleData): void {
    this.payload = data;
    this.all = [];
    this.views = new Map();
    this.phase = "tick";
    this.actor = null;
    this.menu = null;
    this.statusTexts = [];
    this.weather = WEATHER[data.weather ?? "clear"];
    this.forecastIndex = 0;
  }

  create(): void {
    this.controls = new Controls(this);
    this.drawBackground();
    playMusic(this, this.payload.music ?? DEFAULT_MUSIC);
    this.spawnEnemies();
    this.spawnParty();
    this.buildWindows();
    this.cursor = this.add
      .text(0, 0, CURSOR, textStyle(undefined, ACCENT_COLOR))
      .setDepth(DEPTH_UI)
      .setVisible(false);
    this.say(this.payload.scripted === "lose" ? "This is not a fight you can win." : "Encounter!");
    this.showWeather();
  }

  override update(time: number, delta: number): void {
    this.refreshStatus();
    const steps: Record<Phase, () => void> = {
      tick: () => {
        this.tickPhase(delta);
      },
      command: () => {
        this.commandPhase(time);
      },
      sub: () => {
        this.subPhase(time);
      },
      target: () => {
        this.targetPhase(time);
      },
      acting: () => undefined,
      over: () => undefined,
    };
    steps[this.phase]();
  }

  // --- setup ---------------------------------------------------------------------------------------------------

  private drawBackground(): void {
    const key = this.payload.background === undefined ? undefined : `battlebg_${this.payload.background}`;
    if (key !== undefined && this.textures.exists(key)) {
      this.add.image(0, 0, key).setOrigin(0).setScale(BACKGROUND_SCALE);
      return;
    }
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, BACKGROUND).setOrigin(0);
    this.add.rectangle(0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y, FLOOR_COLOR).setOrigin(0);
  }

  private enemyBody(id: string, at: Slot): View["body"] {
    const enemy = ENEMIES[id];
    const art = enemy?.art;
    if (art !== undefined && this.textures.exists(art)) {
      const scale = enemy?.artScale ?? (art.startsWith(BOSS_PREFIX) ? BOSS_SCALE : ENEMY_SCALE);
      const image = this.add.image(at.x, at.y, art).setScale(scale);
      if (enemy?.tint !== undefined) image.setTint(enemy.tint);
      return image;
    }
    const width = enemy?.width ?? SUMMON_SIZE;
    const height = enemy?.height ?? SUMMON_SIZE;
    return this.add
      .rectangle(at.x, at.y, width, height, enemy?.color ?? GAUGE_BACK)
      .setStrokeStyle(OUTLINE_WIDTH, OUTLINE);
  }

  /** An enemy at this difficulty's strength (its max HP scales too, so the numbers stay honest). */
  private foe(id: string, index: number): Combatant {
    const c = rules.enemyCombatant(id, index);
    const hp = foeHp(c.stats.hp);
    return { ...c, hp, stats: { ...c.stats, hp } };
  }

  private spawnEnemies(): void {
    this.payload.enemies.forEach((id, index) => {
      const c = this.foe(id, index);
      const at = enemySlot(index, this.payload.enemies.length);
      const body = this.enemyBody(id, at);
      const below = at.y + body.displayHeight / HALF + LABEL_GAP;
      const label = this.add.text(at.x, below, c.name, textStyle(FONT_SIZE_SMALL)).setOrigin(CENTER, 0);
      this.all.push(c);
      this.views.set(c.key, { body, label });
    });
  }

  private spawnParty(): void {
    const state = getState(this);
    state.party.forEach((id, index) => {
      const saved = state.member(id);
      const c = rules.partyCombatant(id, saved.hp, saved.mp);
      const y = PARTY_Y0 + index * PARTY_SPACING;
      const body = this.add
        .sprite(PARTY_X + index * PARTY_STAGGER, y, figureFor(state.chapter, id))
        .setOrigin(CENTER, FIGURE_ORIGIN_Y)
        .setScale(FIGURE_SCALE);
      body.play(`${figureFor(state.chapter, id)}:idle_left`);
      if (!rules.alive(c)) body.setAlpha(DEAD_ALPHA);
      this.all.push(c);
      this.views.set(c.key, { body });
    });
  }

  private buildWindows(): void {
    const g = this.add.graphics().setDepth(DEPTH_UI);
    drawWindow(g, STATUS_X, STATUS_Y, STATUS_W, STATUS_H);
    drawWindow(g, COMMAND_X, MESSAGE_Y, GAME_WIDTH - COMMAND_X * HALF, MESSAGE_H);
    this.message = this.add
      .text(COMMAND_X + PADDING, MESSAGE_Y + MESSAGE_PAD_Y, "", textStyle())
      .setDepth(DEPTH_UI + 1);
    this.weatherText = this.add
      .text(WEATHER_X, MESSAGE_Y + MESSAGE_PAD_Y, "", textStyle(FONT_SIZE_SMALL, DIM_COLOR))
      .setDepth(DEPTH_UI + 1);
    this.commandBox = this.add.graphics().setDepth(DEPTH_UI);
    this.gauges = this.add.graphics().setDepth(DEPTH_UI + 1);
    this.partyMembers().forEach((c, index) => {
      const y = STATUS_Y + PADDING + index * ROW_SPACING;
      const columns = [0, HP_COLUMN, MP_COLUMN, TAG_COLUMN];
      const colors = [undefined, undefined, DIM_COLOR, STATUS_COLOR];
      columns.forEach((column, slot) => {
        const size = slot === 0 ? undefined : FONT_SIZE_SMALL;
        const text = this.add.text(
          STATUS_X + PADDING + column,
          y,
          slot === 0 ? c.name : "",
          textStyle(size, colors[slot]),
        );
        this.statusTexts.push(text.setDepth(DEPTH_UI + 1));
      });
    });
  }

  private partyMembers(): Combatant[] {
    return this.all.filter((c) => c.side === "party");
  }

  private refreshStatus(): void {
    this.gauges.clear();
    this.partyMembers().forEach((c, index) => {
      const row = index * TEXTS_PER_ROW;
      this.statusTexts[row + HP_SLOT]?.setText(`HP ${c.hp}/${c.stats.hp}`);
      this.statusTexts[row + MP_SLOT]?.setText(`MP ${c.mp}`);
      this.statusTexts[row + TAG_SLOT]?.setText(c.statuses.map((s) => TAGS[s.id]).join(" "));
      this.drawGauges(c, STATUS_Y + PADDING + index * ROW_SPACING);
    });
  }

  private drawGauges(c: Combatant, y: number): void {
    const x = STATUS_X + GAUGE_X;
    const atb = (c.gauge / rules.GAUGE_FULL) * GAUGE_W;
    const encore = (c.encore / rules.ENCORE_FULL) * GAUGE_W;
    this.gauges.fillStyle(GAUGE_BACK, 1).fillRect(x, y + GAUGE_LIFT, GAUGE_W, GAUGE_H);
    this.gauges
      .fillStyle(rules.alive(c) ? GAUGE_COLOR : GAUGE_BACK, 1)
      .fillRect(x, y + GAUGE_LIFT, atb, GAUGE_H);
    this.gauges.fillStyle(GAUGE_BACK, 1).fillRect(x, y + ENCORE_LIFT, GAUGE_W, GAUGE_H);
    this.gauges.fillStyle(ENCORE_COLOR, 1).fillRect(x, y + ENCORE_LIFT, encore, GAUGE_H);
  }

  private say(text: string): void {
    this.message.setText(text);
  }

  private showWeather(): void {
    this.weatherText.setText(this.weather.id === "clear" ? "" : this.weather.name);
  }

  // --- phases --------------------------------------------------------------------------------------------------

  private tickPhase(delta: number): void {
    rules.tick(this.all, delta, this.weather);
    const next = rules.ready(this.all);
    if (next === undefined) return;
    if (this.loseTurn(next)) return;
    if (status.turnsOnAllies(next)) {
      this.confusedAct(next);
      return;
    }
    if (next.side === "party") this.openCommand(next);
    else this.enemyAct(next);
  }

  /** A stunned combatant loses the turn; true when it did. */
  private loseTurn(c: Combatant): boolean {
    if (!status.skipsTurn(c)) return false;
    this.phase = "acting";
    this.say(`${c.name} can't move!`);
    this.time.delayedCall(ACT_MS, () => {
      this.afterAction(c);
    });
    return true;
  }

  /** Charmed: hits someone on its own side (or the air, if it stands alone). */
  private confusedAct(c: Combatant): void {
    this.phase = "acting";
    const friends = rules.living(this.all, c.side).filter((other) => other.key !== c.key);
    if (friends.length === 0) {
      this.say(`${c.name} is too charmed to fight.`);
      this.time.delayedCall(ACT_MS, () => {
        this.afterAction(c);
      });
      return;
    }
    const target = rules.pick(friends, Math.random);
    this.strike(c, target, 1, `${c.name} is charmed and hits ${target.name}!`);
  }

  private openCommand(actor: Combatant): void {
    this.actor = actor;
    this.phase = "command";
    this.say(`${actor.name}'s turn.`);
    this.commands = rules.encoreReady(actor) ? [...BASE_COMMANDS, "encore"] : [...BASE_COMMANDS];
    this.showMenu(this.commands.map((command) => COMMAND_LABELS[command]));
  }

  private showMenu(labels: readonly string[], enabled?: readonly boolean[]): void {
    this.menu?.destroy();
    const height = labels.length * LINE_HEIGHT + PADDING * HALF;
    this.commandBox.clear();
    drawWindow(this.commandBox, COMMAND_X, STATUS_Y, COMMAND_W, Math.max(height, STATUS_H));
    this.menu = new Menu(this, COMMAND_X + PADDING, STATUS_Y + PADDING, labels, enabled, DEPTH_UI + 1);
  }

  private reopenCommands(): void {
    this.phase = "command";
    this.showMenu(this.commands.map((command) => COMMAND_LABELS[command]));
  }

  private closeMenu(): void {
    this.menu?.destroy();
    this.menu = null;
    this.commandBox.clear();
  }

  private commandPhase(time: number): void {
    if (this.menu === null) return;
    this.menu.move(this.controls.menuStep(time));
    const tap = this.controls.tapped();
    const onMenu = this.menu.tapTo(tap);
    if (!onMenu && this.attackTapped(tap)) return;
    if (!onMenu && !this.controls.pressedA()) return;
    const command = this.commands[this.menu.selected] ?? "attack";
    this.plan = { command };
    const next: Record<Command, () => void> = {
      attack: () => {
        this.beginTargeting("enemy");
      },
      skill: () => {
        this.openSkills();
      },
      item: () => {
        this.openItems();
      },
      encore: () => {
        this.fireEncore();
      },
    };
    next[command]();
  }

  /** A tap on a living enemy at the command menu is a plain Attack on it, no menu needed; true when it was. */
  private attackTapped(tap: Point | null): boolean {
    if (tap === null || this.actor === null) return false;
    this.targets = rules.living(this.all, "enemy");
    const picked = this.targetAt(tap);
    const target = picked === null ? undefined : this.targets[picked];
    if (target === undefined) return false;
    this.plan = { command: "attack" };
    this.closeMenu();
    this.execute(this.actor, target);
    return true;
  }

  private openSkills(): void {
    const actor = this.actor;
    if (actor?.memberId === undefined) return;
    this.phase = "sub";
    const skills = MEMBERS[actor.memberId].skills
      .map((id) => SKILLS[id])
      .filter((s): s is Skill => s !== undefined);
    this.subOptions = skills.map((s) => s.id);
    this.showMenu(
      skills.map((s) => `${s.name} (${s.mp})`),
      skills.map((s) => s.mp <= actor.mp),
    );
  }

  private openItems(): void {
    this.phase = "sub";
    const state = getState(this);
    const items = Object.values(ITEMS).filter((item) => (state.items[item.id] ?? 0) > 0);
    this.subOptions = items.map((item) => item.id);
    const labels =
      items.length > 0 ? items.map((item) => `${item.name} x${state.items[item.id] ?? 0}`) : ["(nothing)"];
    this.showMenu(labels, items.length > 0 ? undefined : [false]);
  }

  private subPhase(time: number): void {
    if (this.menu === null) return;
    this.menu.move(this.controls.menuStep(time));
    const tap = this.controls.tapped();
    const onMenu = this.menu.tapTo(tap);
    if (this.controls.pressedB() || (tap !== null && !onMenu)) {
      this.reopenCommands(); // B, or a tap off the list, goes back
      return;
    }
    const chose = onMenu || this.controls.pressedA();
    if (!chose || !this.menu.isEnabled) return;
    const chosen = this.subOptions[this.menu.selected];
    if (chosen === undefined) return;
    if (this.plan.command === "skill") this.chooseSkill(chosen);
    else this.chooseItem(chosen);
  }

  private chooseSkill(id: string): void {
    const skill = SKILLS[id];
    if (skill === undefined) return;
    this.plan.skill = skill;
    this.beginTargeting(skill.target);
  }

  private chooseItem(id: string): void {
    const item = ITEMS[id];
    if (item === undefined) return;
    this.plan.item = item;
    this.beginTargeting("ally");
  }

  private beginTargeting(side: "enemy" | "ally"): void {
    this.targets = rules.living(this.all, side === "enemy" ? "enemy" : "party");
    this.targetIndex = 0;
    this.phase = "target";
    this.cursor.setVisible(true);
    this.placeCursor();
  }

  private placeCursor(): void {
    const target = this.targets[this.targetIndex];
    const view = target === undefined ? undefined : this.views.get(target.key);
    if (view === undefined) return;
    const { body } = view;
    const half =
      body instanceof Phaser.GameObjects.Sprite
        ? body.displayWidth / SPRITE_QUARTER
        : body.displayWidth / HALF;
    this.cursor.setPosition(body.x - half - LINE_HEIGHT, body.y - LINE_HEIGHT);
  }

  private targetPhase(time: number): void {
    const step = this.controls.menuStep(time) || this.controls.menuSide(time);
    if (step !== 0) {
      this.targetIndex = (this.targetIndex + step + this.targets.length) % this.targets.length;
      this.placeCursor();
    }
    const tap = this.controls.tapped();
    const picked = tap === null ? null : this.targetAt(tap);
    if (this.controls.pressedB() || (tap !== null && picked === null)) {
      this.cursor.setVisible(false);
      this.reopenCommands(); // B, or a tap on nobody, goes back
      return;
    }
    if (picked !== null) this.targetIndex = picked;
    else if (!this.controls.pressedA()) return;
    const target = this.targets[this.targetIndex];
    if (target === undefined || this.actor === null) return;
    this.cursor.setVisible(false);
    this.closeMenu();
    this.execute(this.actor, target);
  }

  /** The target whose middle is nearest a tap, if any is within reach. */
  private targetAt(point: Point): number | null {
    let best: number | null = null;
    let bestDistance = TARGET_REACH;
    this.targets.forEach((target, index) => {
      const body = this.views.get(target.key)?.body;
      if (body === undefined) return;
      const lift = body instanceof Phaser.GameObjects.Sprite ? body.displayHeight * FIGURE_MIDDLE : 0;
      const far = Phaser.Math.Distance.Between(point.x, point.y, body.x, body.y - lift);
      if (far > bestDistance) return;
      best = index;
      bestDistance = far;
    });
    return best;
  }

  // --- actions -------------------------------------------------------------------------------------------------

  private execute(actor: Combatant, target: Combatant): void {
    this.phase = "acting";
    const { command, skill, item } = this.plan;
    if (command === "attack") {
      this.strike(actor, target, 1, `${actor.name} attacks ${target.name}!`);
      return;
    }
    if (command === "skill" && skill !== undefined) {
      this.useSkill(actor, target, skill);
      return;
    }
    if (item !== undefined) {
      getState(this).take(item.id);
      this.mend(actor, target, item.heal, `${target.name} ${item.line}.`);
    }
  }

  private useSkill(actor: Combatant, target: Combatant, skill: Skill): void {
    actor.mp -= skill.mp;
    if (skill.inflict !== undefined) status.inflict(target, skill.inflict.status, skill.inflict.turns);
    if (skill.self !== undefined) status.inflict(actor, skill.self.status, skill.self.turns);
    if (skill.kind === "attack") {
      this.strike(actor, target, skill.power, `${actor.name} ${skill.line} ${target.name}!`, skill.school);
      return;
    }
    this.mend(
      actor,
      target,
      rules.healAmount(actor.stats, skill.power),
      `${actor.name} ${skill.line} ${target.name}.`,
    );
  }

  private enemyAct(actor: Combatant): void {
    this.phase = "acting";
    this.advanceForecast();
    const party = rules.living(this.all, "party");
    const target = rules.pick(party, Math.random);
    const lines = actor.enemyId === undefined ? undefined : ENEMIES[actor.enemyId]?.lines;
    const line = rules.pick(lines ?? ["attacks"], Math.random);
    this.strike(actor, target, 1, rules.enemyAttackText(actor.name, line, target.name));
  }

  private advanceForecast(): void {
    if (this.payload.forecast !== true) return;
    const next = FORECAST_CYCLE[this.forecastIndex % FORECAST_CYCLE.length] ?? "clear";
    this.forecastIndex += 1;
    this.weather = WEATHER[next];
    this.showWeather();
    this.floatText(GAME_WIDTH / HALF, FLOOR_Y / HALF, this.weather.line, ACCENT_COLOR);
  }

  private strike(
    actor: Combatant,
    target: Combatant,
    power: number,
    text: string,
    school: School = "physical",
  ): void {
    this.say(text);
    const raw = rules.strikeAmount(actor, target, power, Math.random, { weather: this.weather, school });
    const amount = actor.side === "enemy" ? foeDamage(raw) : raw;
    this.lunge(actor, () => {
      rules.hurt(target, amount);
      rules.chargeEncore(actor, target, encoreCharge(amount));
      this.flash(target, `${amount}`, "#ffffff");
      this.afterAction(actor);
    });
  }

  private mend(actor: Combatant, target: Combatant, amount: number, text: string): void {
    this.say(text);
    const healed = rules.heal(target, amount);
    this.flash(target, `+${healed}`, HEAL_COLOR);
    this.time.delayedCall(ACT_MS, () => {
      this.afterAction(actor);
    });
  }

  // --- encore --------------------------------------------------------------------------------------------------

  private fireEncore(): void {
    const actor = this.actor;
    if (actor?.memberId === undefined) return;
    this.closeMenu();
    this.phase = "acting";
    const encore = ENCORES[actor.memberId];
    this.say(`${actor.name} ${encore.line}!`);
    this.banner(encore.name, encore.summon);
    const events = performEncore(encore, actor, this.all, Math.random, this.weather);
    this.time.delayedCall(BANNER_MS, () => {
      this.playEvents(events, actor);
    });
  }

  private banner(name: string, summon: string | undefined): void {
    const art = summon === undefined ? undefined : `pet_${summon}`;
    if (art !== undefined && this.textures.exists(art)) {
      const image = this.add
        .image(GAME_WIDTH / HALF, FLOOR_Y / HALF, art)
        .setDisplaySize(SUMMON_SIZE, SUMMON_SIZE);
      this.tweens.add({
        targets: image.setDepth(DEPTH_BANNER),
        alpha: 0,
        delay: BANNER_MS,
        duration: ACT_MS,
      });
    }
    const text = this.add
      .text(GAME_WIDTH / HALF, FLOOR_Y / HALF - SUMMON_SIZE / HALF, name, {
        ...textStyle(FONT_SIZE_TITLE, ACCENT_COLOR),
        ...BANNER_OUTLINE,
      })
      .setOrigin(CENTER)
      .setDepth(DEPTH_BANNER);
    this.cameras.main.flash(ACT_MS / HALF);
    this.tweens.add({
      targets: text,
      alpha: 0,
      delay: BANNER_MS,
      duration: ACT_MS,
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private playEvents(events: readonly EncoreEvent[], actor: Combatant): void {
    events.forEach((event, index) => {
      this.time.delayedCall(index * EVENT_GAP_MS, () => {
        this.showEvent(event);
      });
    });
    this.time.delayedCall(events.length * EVENT_GAP_MS + ACT_MS, () => {
      this.afterAction(actor);
    });
  }

  private showEvent(event: EncoreEvent): void {
    const target = this.all.find((c) => c.key === event.targetKey);
    if (target === undefined) return;
    const shows: Record<EncoreEvent["kind"], () => void> = {
      damage: () => {
        this.flash(target, `${event.amount}`, "#ffffff");
      },
      heal: () => {
        this.flash(target, `+${event.amount}`, HEAL_COLOR);
      },
      status: () => {
        this.flash(
          target,
          event.status === undefined ? "" : status.STATUS_RULES[event.status].name,
          STATUS_COLOR,
        );
      },
      steal: () => {
        getState(this).give(STEAL_ITEM, event.amount);
        this.flash(target, "Stolen!", ACCENT_COLOR);
      },
    };
    shows[event.kind]();
  }

  // --- effects -------------------------------------------------------------------------------------------------

  private lunge(actor: Combatant, onHit: () => void): void {
    const body = this.views.get(actor.key)?.body;
    if (body === undefined) {
      onHit();
      return;
    }
    const toward = actor.side === "party" ? -LUNGE_PX : LUNGE_PX;
    if (body instanceof Phaser.GameObjects.Sprite && actor.memberId !== undefined)
      body.play(`${figureFor(getState(this).chapter, actor.memberId)}:slash_left`);
    this.tweens.add({ targets: body, x: body.x + toward, duration: LUNGE_MS, yoyo: true, onComplete: onHit });
  }

  private flash(target: Combatant, text: string, color: string): void {
    const view = this.views.get(target.key);
    if (view === undefined) return;
    const { body } = view;
    if (body instanceof Phaser.GameObjects.Rectangle) {
      body.setAlpha(CENTER);
      this.time.delayedCall(HIT_FLASH_MS, () => body.setAlpha(1));
    } else {
      body.setTint(HURT_TINT);
      this.time.delayedCall(HIT_FLASH_MS, () => {
        this.restoreTint(target, body);
      });
    }
    this.floatText(body.x, body.y - LINE_HEIGHT, text, color);
  }

  /** Back to the enemy's own tint (a true form stays red) or none. */
  private restoreTint(target: Combatant, body: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image): void {
    const tint = target.enemyId === undefined ? undefined : ENEMIES[target.enemyId]?.tint;
    if (tint === undefined) body.clearTint();
    else body.setTint(tint);
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, textStyle(undefined, color))
      .setOrigin(CENTER)
      .setDepth(DEPTH_FLOAT);
    this.tweens.add({
      targets: label,
      y: y - FLOAT_RISE,
      alpha: 0,
      duration: FLOAT_MS,
      onComplete: () => {
        label.destroy();
      },
    });
  }

  private afterAction(actor: Combatant): void {
    actor.gauge = 0;
    status.endTurn(actor);
    this.fadeTheFallen();
    const result = rules.outcome(this.all);
    if (result === null) {
      this.time.delayedCall(ACT_MS, () => {
        this.phase = "tick";
      });
      return;
    }
    this.finish(result);
  }

  private fadeTheFallen(): void {
    for (const c of this.all) {
      if (rules.alive(c)) continue;
      const view = this.views.get(c.key);
      view?.body.setAlpha(DEAD_ALPHA);
      view?.label?.setAlpha(DEAD_ALPHA);
      if (view?.body instanceof Phaser.GameObjects.Sprite && c.memberId !== undefined)
        view.body.play(`${figureFor(getState(this).chapter, c.memberId)}:hurt`);
    }
  }

  // --- the end -------------------------------------------------------------------------------------------------

  private finish(result: BattleOutcome): void {
    this.phase = "over";
    this.writeBack();
    if (result === "won") {
      this.win();
      return;
    }
    if (this.payload.scripted === "lose") {
      getState(this).healAll();
      this.say("The party falls...");
      this.time.delayedCall(END_MS, () => {
        this.end(result);
      });
      return;
    }
    this.say(CAMPAIGN.battle.defeat);
    this.time.delayedCall(END_MS, () => {
      this.scene.stop();
      this.scene.start("title");
    });
  }

  private win(): void {
    const state = getState(this);
    const earned = rules.spoils(this.all);
    state.stayPoints += earned;
    state.healAll(); // a short, kind game: LOOSE ENDS's cheers put everyone back on their feet
    playMusic(this, VICTORY_MUSIC, false);
    this.say(`Victory! +${earned} ${CAMPAIGN.battle.currency}.`);
    this.time.delayedCall(END_MS, () => {
      this.end("won");
    });
  }

  /** HP and MP carry over (a scripted loss heals afterwards; a win heals in win()). */
  private writeBack(): void {
    const state = getState(this);
    for (const c of this.all) {
      if (c.memberId === undefined) continue;
      const id: MemberId = c.memberId;
      state.members[id] = { hp: Math.max(1, c.hp), mp: c.mp };
    }
  }

  private end(result: BattleOutcome): void {
    const done = this.payload.onDone;
    this.scene.stop();
    done(result);
  }
}
