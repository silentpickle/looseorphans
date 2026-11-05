// A painted screen, an ASCII grid over it, NPCs, warps, encounters, and the script runner that turns dialogue
// actions into battles, cutscenes, warps and chapter changes. She walks with keys or the D-pad, or by tapping:
// a spot to walk there, a person to walk up and talk, a doorway to go through. A flashing marker points the way
// when one thing is clearly next (systems/beacon.ts).
import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { CAMPAIGN } from "@campaign";
import { figureFor } from "../data/figures";
import type { WeatherId } from "../data/weather";
import { COMPANIONS } from "../data/members";
import type { Action, Chapter, Dir, MapDef, MemberId, Node, Npc, Warp } from "../data/types";
import { playMusic } from "../audio/music";
import { encounterRate } from "../systems/difficulty";
import { Controls } from "../input/controls";
import type { Point } from "../input/controls";
import { getState } from "../registry";
import { beacon } from "../systems/beacon";
import type { BeaconWorld } from "../systems/beacon";
import { besideCell, route, sameCell } from "../systems/route";
import type { Cell } from "../systems/route";
import { dirOf, pickTalkTarget } from "../systems/talk";
import { writeSave } from "../systems/save";
import type { BattleData, BattleOutcome } from "./battle";
import type { CutsceneData } from "./cutscene";
import type { DialogueData } from "./dialogue";
import type { MinigameData, MinigameResult } from "../minigames/types";
import { launchOver } from "./launch";
import { drawMark, eraseMark } from "../ui/beacon-mark";
import type { MarkSpot } from "../ui/beacon-mark";
import { MeterHud } from "../ui/meter-hud";
import { DIM_COLOR, FONT_SIZE_SMALL, textStyle } from "../ui/theme";
import { GuestFollower } from "./guest";
import { SPARK_KEY } from "./boot";

const HALF = 2;

export interface OverworldData {
  map: string;
  x: number;
  y: number;
}

interface Actor {
  npc: Npc;
  sprite: Phaser.GameObjects.Sprite;
  cx: number;
  cy: number;
}

/** Where a tap sends her: up to a person, or onto a cell. */
type Goal = { actor: Actor } | { cell: Cell };

interface Mark {
  goal: Goal;
  at: Point;
  pieces: Phaser.GameObjects.Graphics[];
}

const CELL = 32;
const HALF_CELL = CELL / HALF;
const WALL = "#";
const FIGURE_SCALE = 2;
const FIGURE_ORIGIN_Y = 0.93;
const CENTER = 0.5;
const SPEED_PX_PER_S = 130;
const MS_PER_S = 1000;
const STEP_PX = 32;
const ENCOUNTER_GRACE_STEPS = 10; // no random fight in the first steps after a map change or a fight
const INTERACT_DISTANCE = 60; // a cell and most of the next: talking should be forgiving on touch
const BACKDROP_SCALE = 2;
const NAME_FADE_MS = 2600;
const NAME_X = 8;
const NAME_Y = 6;
const ENTERED_PREFIX = "entered:";
const HEARD_PREFIX = "heard:"; // a dialogue she has had from a person, for the marker
const VISITED_PREFIX = "visited:"; // a map she has stood on, for the marker
const FIGURE_REACH_UP = 96; // a tap up to this far above a person's feet (the top of their head) is on them
const MARK_REACH = 28; // a tap this close to the marker's arrow follows it
const NPC_MARK_LIFT = 104; // the arrow's tip sits this far above a person's feet, clear of their head
const DOOR_MARK_LIFT = 18; // and this far above a doorway's centre
const NO_AXIS = { x: 0, y: 0 };
const DEPTH_PER_PX = 1;
const FALLBACK_CHAPTER = CAMPAIGN.startChapter;
const COMPANION_GAP = 30;
const COMPANION_EASE = 6; // fraction of the gap closed per second
const STAND_IN_SIZE = 24; // a pictured NPC (a cat) whose picture isn't drawn yet: a dark square
const STAND_IN_TINT = 0x111111;
const PICTURE_MAX_HEIGHT = 96; // a pictured NPC drawn from boss art is shrunk to about a figure's height
const PICTURE_ORIGIN_Y = 0.85; // a picture stands on its cell like a figure: anchored at the cell centre, feet below
const BEHIND: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
};

function cellCenter(cell: Cell): { x: number; y: number } {
  return { x: cell.cx * CELL + HALF_CELL, y: cell.cy * CELL + HALF_CELL };
}

function cellOf(x: number, y: number): Cell {
  return { cx: Math.floor(x / CELL), cy: Math.floor(y / CELL) };
}

function glyphAt(grid: readonly string[], cell: Cell): string {
  return grid[cell.cy]?.[cell.cx] ?? WALL;
}

function findGlyph(grid: readonly string[], glyph: string): Cell | null {
  for (const [cy, row] of grid.entries()) {
    const cx = row.indexOf(glyph);
    if (cx >= 0) return { cx, cy };
  }
  return null;
}

export class OverworldScene extends Phaser.Scene {
  private start!: OverworldData;
  private chapter!: Chapter;
  private map!: MapDef;
  private controls!: Controls;
  private player!: Phaser.GameObjects.Sprite;
  private companion: Phaser.GameObjects.Image | null = null;
  private guest: GuestFollower | null = null;
  private hud: MeterHud | null = null;
  private figure = "m1";
  private lead: MemberId = "m1";
  private actors: Actor[] = [];
  private busy = false;
  private facing: Dir = "down";
  private moving = false;
  private traveled = 0;
  private stepsSinceFight = 0;
  private path: Cell[] = [];
  private pathGoal: Actor | null = null;
  private mark: Mark | null = null;

  constructor() {
    super("overworld");
  }

  init(data: OverworldData): void {
    this.start = data;
    this.actors = [];
    this.busy = false;
    this.traveled = 0;
    this.stepsSinceFight = 0;
    this.path = [];
    this.pathGoal = null;
    this.mark = null;
    this.guest = null;
    this.hud = null;
  }

  create(): void {
    const state = getState(this);
    const { chapter, map } = this.resolvePlace();
    this.chapter = chapter;
    this.map = map;
    state.chapter = chapter.id;
    this.controls = new Controls(this);
    this.drawBackdrop();
    this.playMapMusic();
    this.placeActors();
    this.placePlayer();
    this.placeCompanion();
    this.placeGuest();
    this.placeHud();
    this.showName();
    this.remember();
    this.enterScript();
    if (!this.busy) this.showMark();
  }

  override update(_time: number, delta: number): void {
    if (this.busy) return;
    if (this.readTap()) return; // the tap started a talk
    this.move(delta);
    this.animate();
    this.follow(delta);
    this.guest?.follow(this.player, this.facing, delta);
    if (this.reachedGoal()) return;
    if (this.controls.pressedA()) this.interact();
    this.checkWarp();
  }

  /** Where the player stands, for QA drivers and warps. */
  playerCell(): Cell {
    return cellOf(this.player.x, this.player.y);
  }

  /**
   * The chapter and map to show. A save from an older version can name a map that no longer exists; rather than
   * crash, fall back to that chapter's start (or the prologue's) and stand the player at its start cell.
   */
  private resolvePlace(): { chapter: Chapter; map: MapDef } {
    const state = getState(this);
    const chapter = CAMPAIGN.chapters[state.chapter] ?? CAMPAIGN.chapters[FALLBACK_CHAPTER];
    if (chapter === undefined) throw new Error(`no chapter ${state.chapter} and no ${FALLBACK_CHAPTER}`);
    const map = chapter.maps[this.start.map];
    if (map !== undefined) return { chapter, map };
    const startMap = chapter.maps[chapter.start.map];
    if (startMap === undefined)
      throw new Error(`chapter ${chapter.id} has no start map ${chapter.start.map}`);
    this.start = { map: chapter.start.map, x: chapter.start.x, y: chapter.start.y };
    return { chapter, map: startMap };
  }

  private playMapMusic(): void {
    if (this.map.music !== undefined) playMusic(this, this.map.music);
  }

  private drawBackdrop(): void {
    const key = this.map.backdrop;
    if (key !== null && this.textures.exists(key)) {
      this.add.image(0, 0, key).setOrigin(0).setScale(BACKDROP_SCALE);
      return;
    }
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, this.map.placeholder).setOrigin(0);
  }

  private figureSprite(figure: string, cell: Cell, facing: Dir): Phaser.GameObjects.Sprite {
    const { x, y } = cellCenter(cell);
    const sprite = this.add.sprite(x, y, figure).setOrigin(CENTER, FIGURE_ORIGIN_Y).setScale(FIGURE_SCALE);
    sprite.play(`${figure}:idle_${facing}`);
    sprite.setDepth(y * DEPTH_PER_PX);
    return sprite;
  }

  private placeActors(): void {
    for (const npc of this.map.npcs) {
      const cell = findGlyph(this.map.grid, npc.glyph);
      if (cell === null) continue;
      const sprite = this.npcSprite(npc, cell);
      this.actors.push({ npc, sprite, ...cell });
    }
    this.refreshActors();
  }

  /** A person is an LPC figure; a pictured NPC (a cat on a step) is a still image. */
  private npcSprite(npc: Npc, cell: Cell): Phaser.GameObjects.Sprite {
    if (npc.figure !== undefined) return this.figureSprite(npc.figure, cell, npc.facing ?? "down");
    const { x, y } = cellCenter(cell);
    const drawn = npc.image !== undefined && this.textures.exists(npc.image);
    const sprite = this.add
      .sprite(x, y, drawn ? (npc.image ?? SPARK_KEY) : SPARK_KEY)
      .setOrigin(CENTER, PICTURE_ORIGIN_Y);
    if (!drawn) sprite.setDisplaySize(STAND_IN_SIZE, STAND_IN_SIZE).setTint(STAND_IN_TINT);
    if (drawn && sprite.height > PICTURE_MAX_HEIGHT) sprite.setScale(PICTURE_MAX_HEIGHT / sprite.height);
    sprite.setDepth(y * DEPTH_PER_PX);
    return sprite;
  }

  private placeGuest(): void {
    const guest = this.chapter.guest;
    if (guest === undefined) return;
    this.guest = new GuestFollower(this, guest, this.player);
    this.guest.refresh(getState(this));
  }

  private placeHud(): void {
    if (!CAMPAIGN.meter.hud) return;
    this.hud = new MeterHud(this, CAMPAIGN.meter.name, CAMPAIGN.meter.max);
    this.hud.show(getState(this).meter);
  }

  private placePlayer(): void {
    const state = getState(this);
    this.lead = state.party[0] ?? "m1";
    this.figure = figureFor(state.chapter, this.lead);
    this.player = this.figureSprite(this.figure, { cx: this.start.x, cy: this.start.y }, "down");
  }

  private placeCompanion(): void {
    const key = `pet_${COMPANIONS[this.lead]}`;
    this.companion = null;
    if (!this.textures.exists(key)) return;
    this.companion = this.add.image(this.player.x - COMPANION_GAP, this.player.y, key).setOrigin(CENTER, 1);
  }

  /** Trot toward a point a little behind the player, so it lags on turns and catches up on stops. */
  private follow(delta: number): void {
    const pet = this.companion;
    if (pet === null) return;
    const behind = BEHIND[this.facing];
    const tx = this.player.x + behind.x * COMPANION_GAP;
    const ty = this.player.y + behind.y * COMPANION_GAP;
    const ease = Math.min(1, (delta / MS_PER_S) * COMPANION_EASE);
    pet.setPosition(pet.x + (tx - pet.x) * ease, pet.y + (ty - pet.y) * ease);
    pet.setFlipX(tx > pet.x);
    pet.setDepth(pet.y * DEPTH_PER_PX);
  }

  private showName(): void {
    const label = this.add
      .text(NAME_X, NAME_Y, this.map.name, textStyle(FONT_SIZE_SMALL, DIM_COLOR))
      .setDepth(GAME_HEIGHT);
    this.tweens.add({ targets: label, alpha: 0, delay: NAME_FADE_MS, duration: NAME_FADE_MS });
  }

  private remember(): void {
    const state = getState(this);
    state.map = this.map.id;
    state.set(this.visitedFlag(this.map.id));
    state.x = this.start.x;
    state.y = this.start.y;
    writeSave(state.toSave());
  }

  private enterScript(): void {
    const id = this.map.onEnter;
    if (id === undefined) return;
    const state = getState(this);
    if (state.has(this.enteredFlag())) return;
    // Marked as seen when it starts, so a script that ends by restarting the map (a party change) can't loop. The
    // save on disk only gains the flag at the next save, so quitting mid-scene still replays it on Continue.
    state.set(this.enteredFlag());
    this.runDialogue(id);
  }

  private enteredFlag(): string {
    return `${ENTERED_PREFIX}${this.chapter.id}:${this.map.id}`;
  }

  private heardFlag(dialogue: string): string {
    return `${HEARD_PREFIX}${this.chapter.id}:${dialogue}`;
  }

  private visitedFlag(map: string): string {
    return `${VISITED_PREFIX}${this.chapter.id}:${map}`;
  }

  private refreshActors(): void {
    const state = getState(this);
    for (const actor of this.actors) {
      const shown =
        state.check(actor.npc.shownWhen) &&
        !(actor.npc.hiddenWhen !== undefined && state.check(actor.npc.hiddenWhen));
      actor.sprite.setVisible(shown);
    }
    this.guest?.refresh(state);
    this.hud?.show(state.meter);
  }

  private move(delta: number): void {
    const step = (SPEED_PX_PER_S * delta) / MS_PER_S;
    const axis = this.steering(step);
    this.moving = axis.x !== 0 || axis.y !== 0;
    if (!this.moving) return;
    const length = Math.hypot(axis.x, axis.y);
    const dx = (axis.x / length) * step;
    const dy = (axis.y / length) * step;
    const { x, y } = this.player;
    this.tryMove(dx, 0);
    this.tryMove(0, dy);
    if (this.player.x === x && this.player.y === y) this.stopPath(); // something stepped into the way
    this.facing = dirOf(axis.x, axis.y, this.facing);
    this.player.setDepth(this.player.y * DEPTH_PER_PX);
    this.traveled += step;
    if (this.traveled < STEP_PX) return;
    this.traveled -= STEP_PX;
    this.rollEncounter();
  }

  /** Keys and the D-pad win (and drop any tapped path); otherwise the next cell of the tapped path. */
  private steering(step: number): { x: number; y: number } {
    const axis = this.controls.axis();
    if (axis.x === 0 && axis.y === 0) return this.pathAxis(step);
    this.stopPath();
    return axis;
  }

  /** Toward the next cell's centre; on reaching it, on to the one after. */
  private pathAxis(step: number): { x: number; y: number } {
    const next = this.path[0];
    if (next === undefined) return NO_AXIS;
    const target = cellCenter(next);
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    if (Math.hypot(dx, dy) > step) return { x: dx, y: dy };
    this.player.setPosition(target.x, target.y);
    this.path.shift();
    return this.pathAxis(step);
  }

  /** At the end of a tapped path to a person: talk to them. */
  private reachedGoal(): boolean {
    const goal = this.pathGoal;
    if (goal === null || this.path.length > 0) return false;
    this.pathGoal = null;
    this.talkTo(goal);
    return true;
  }

  private stopPath(): void {
    this.path = [];
    this.pathGoal = null;
  }

  /** Act on a tap; true when it started a talk. */
  private readTap(): boolean {
    const tap = this.controls.tapped();
    if (tap === null) return false;
    this.headFor(this.tapGoal(tap));
    return this.busy;
  }

  /** The marker first, then a doorway, then a person's body, then whatever cell was tapped. */
  private tapGoal(point: Point): Goal {
    const mark = this.mark;
    if (mark !== null && Phaser.Math.Distance.BetweenPoints(point, mark.at) <= MARK_REACH) return mark.goal;
    const cell = cellOf(point.x, point.y);
    if (this.warpAt(cell) !== undefined) return { cell };
    const actor = this.actorAt(point);
    return actor === undefined ? { cell } : { actor };
  }

  /** The person under a tap; where two overlap, the one drawn in front (lower on the screen). */
  private actorAt(point: Point): Actor | undefined {
    const under = this.actors.filter(
      ({ sprite }) =>
        sprite.visible &&
        Math.abs(point.x - sprite.x) <= HALF_CELL &&
        point.y <= sprite.y + HALF_CELL &&
        point.y >= sprite.y - FIGURE_REACH_UP,
    );
    return under.reduce<Actor | undefined>(
      (front, actor) => (front === undefined || actor.sprite.y > front.sprite.y ? actor : front),
      undefined,
    );
  }

  private headFor(goal: Goal): void {
    if ("actor" in goal) {
      this.approach(goal.actor);
      return;
    }
    if (sameCell(goal.cell, this.playerCell())) {
      this.interact(); // a tap on herself is A
      return;
    }
    this.walk(
      route(this.playerCell(), (cell) => sameCell(cell, goal.cell), this.openCell),
      null,
    );
  }

  /** Talk now if close enough, else walk to a cell beside them and talk on arrival. */
  private approach(actor: Actor): void {
    if (this.near(actor)) {
      this.talkTo(actor);
      return;
    }
    const at = { cx: actor.cx, cy: actor.cy };
    this.walk(
      route(this.playerCell(), (cell) => besideCell(cell, at), this.openCell),
      actor,
    );
  }

  private walk(path: Cell[] | null, goal: Actor | null): void {
    if (path === null) return; // nowhere she can stand
    this.path = path;
    this.pathGoal = goal; // an empty path to a person: reachedGoal talks this frame
  }

  private readonly openCell = (cell: Cell): boolean => !this.blockedCell(cell);

  private tryMove(dx: number, dy: number): void {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (this.blocked(nx, ny)) return;
    this.player.setPosition(nx, ny);
  }

  private blocked(x: number, y: number): boolean {
    return this.blockedCell(cellOf(x, y));
  }

  private blockedCell(cell: Cell): boolean {
    if (glyphAt(this.map.grid, cell) === WALL) return true;
    if (this.actors.some((actor) => actor.sprite.visible && actor.cx === cell.cx && actor.cy === cell.cy))
      return true;
    const warp = this.warpAt(cell);
    return warp !== undefined && !getState(this).check(warp.requires);
  }

  private warpAt(cell: Cell): Warp | undefined {
    const glyph = glyphAt(this.map.grid, cell);
    return this.map.warps.find((w) => w.glyph === glyph);
  }

  private animate(): void {
    const key = `${this.figure}:${this.moving ? "walk" : "idle"}_${this.facing}`;
    this.player.play(key, true);
  }

  private near(actor: Actor): boolean {
    const { sprite } = actor;
    return (
      Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y) <= INTERACT_DISTANCE
    );
  }

  private nearestActor(): Actor | undefined {
    const spots = this.actors
      .filter((actor) => actor.sprite.visible)
      .map((actor) => ({ x: actor.sprite.x, y: actor.sprite.y, actor }));
    return pickTalkTarget(spots, this.player, INTERACT_DISTANCE, this.facing)?.actor;
  }

  private interact(): void {
    const actor = this.nearestActor();
    if (actor !== undefined) this.talkTo(actor);
  }

  /** What a person says now: the first variant whose condition holds, else their usual lines. */
  private dialogueOf(actor: Actor): string {
    const state = getState(this);
    const variant = actor.npc.variants?.find((v) => state.check(v.when));
    return variant?.dialogue ?? actor.npc.dialogue;
  }

  private talkTo(actor: Actor): void {
    this.facing = dirOf(actor.sprite.x - this.player.x, actor.sprite.y - this.player.y, this.facing);
    const dialogue = this.dialogueOf(actor);
    getState(this).set(this.heardFlag(dialogue));
    this.runDialogue(dialogue);
  }

  private checkWarp(): void {
    const warp = this.warpAt(this.playerCell());
    if (warp === undefined) return;
    this.travel(warp);
  }

  private beaconWorld(): BeaconWorld {
    const state = getState(this);
    return {
      npcs: this.actors.map((actor) => ({
        glyph: actor.npc.glyph,
        visible: actor.sprite.visible,
        dialogue: this.dialogueOf(actor),
      })),
      warps: this.map.warps.map((warp) => ({
        glyph: warp.glyph,
        open: state.check(warp.requires),
        map: warp.map,
      })),
      heard: (dialogue) => state.has(this.heardFlag(dialogue)),
      visited: (map) => state.has(this.visitedFlag(map)),
    };
  }

  /** Put up the marker if one thing is clearly next (and take down the old one). */
  private showMark(): void {
    this.hideMark();
    const glyph = beacon(this.beaconWorld());
    if (glyph === null) return;
    const actor = this.actors.find((a) => a.npc.glyph === glyph && a.sprite.visible);
    if (actor !== undefined) {
      this.placeMark({ actor }, { x: actor.sprite.x, y: actor.sprite.y - NPC_MARK_LIFT });
      return;
    }
    const cell = findGlyph(this.map.grid, glyph);
    if (cell === null) return;
    const middle = cellCenter(cell);
    this.placeMark({ cell }, { x: middle.x, y: middle.y - DOOR_MARK_LIFT, ring: middle });
  }

  private placeMark(goal: Goal, spot: MarkSpot): void {
    this.mark = { goal, at: { x: spot.x, y: spot.y }, pieces: drawMark(this, spot) };
  }

  private hideMark(): void {
    if (this.mark !== null) eraseMark(this, this.mark.pieces);
    this.mark = null;
  }

  private travel(warp: Warp): void {
    this.busy = true;
    this.scene.restart({ map: warp.map, x: warp.x, y: warp.y } satisfies OverworldData);
  }

  private rollEncounter(): void {
    this.stepsSinceFight += 1;
    const encounters = this.map.encounters;
    if (encounters === undefined || this.stepsSinceFight < ENCOUNTER_GRACE_STEPS) return;
    if (Math.random() >= encounterRate(encounters.rate)) return;
    this.stepsSinceFight = 0;
    const group = encounters.groups[Math.floor(Math.random() * encounters.groups.length)];
    if (group === undefined) return;
    this.fight({ enemies: group, then: null });
  }

  private runDialogue(id: string): void {
    const nodes = this.chapter.dialogues[id];
    if (nodes === undefined) throw new Error(`no dialogue ${id}`);
    this.runNodes(nodes);
  }

  private runNodes(nodes: readonly Node[]): void {
    this.busy = true;
    this.stopPath();
    this.hideMark();
    this.moving = false;
    this.animate();
    const data: DialogueData = {
      nodes,
      onDone: (action) => {
        this.afterDialogue(action);
      },
    };
    launchOver(this, "dialogue", data);
  }

  private afterDialogue(action: Action | undefined): void {
    if (action === undefined) {
      this.free();
      return;
    }
    this.perform(action);
  }

  /** The entry script is only marked done, and the game only saved, once a script chain ends here. */
  private free(): void {
    this.busy = false;
    this.controls.reset();
    this.playMapMusic();
    this.refreshActors();
    this.showMark();
    const state = getState(this);
    state.set(this.enteredFlag());
    const here = this.playerCell();
    state.x = here.cx; // Continue puts her back where she stood, not where she entered the map
    state.y = here.cy;
    writeSave(state.toSave());
  }

  private perform(action: Action): void {
    const handlers: Record<Action["kind"], () => void> = {
      battle: () => {
        if (action.kind === "battle")
          this.fight({
            enemies: action.enemies,
            scripted: action.scripted,
            music: action.music,
            weather: action.weather,
            forecast: action.forecast,
            then: action.then,
          });
      },
      cutscene: () => {
        if (action.kind === "cutscene") this.playCutscene(action);
      },
      warp: () => {
        if (action.kind === "warp") this.travel({ glyph: "", map: action.map, x: action.x, y: action.y });
      },
      party: () => {
        if (action.kind === "party") getState(this).setParty(action.members);
        const here = this.playerCell();
        this.scene.restart({ map: this.map.id, x: here.cx, y: here.cy } satisfies OverworldData);
      },
      minigame: () => {
        if (action.kind === "minigame") this.playMinigame(action);
      },
      give: () => {
        if (action.kind === "give") getState(this).give(action.item, action.count);
        this.free();
      },
      chapter: () => {
        if (action.kind === "chapter") this.startChapter(action.chapter);
      },
      credits: () => {
        this.scene.start("credits");
      },
      end: () => {
        if (action.kind === "end") this.scene.start("end", { text: action.text });
      },
    };
    handlers[action.kind]();
  }

  private fight(spec: {
    enemies: readonly string[];
    scripted?: "lose" | undefined;
    music?: string | undefined;
    weather?: WeatherId | undefined;
    forecast?: boolean | undefined;
    then: string | null;
  }): void {
    this.busy = true;
    this.stopPath();
    this.hideMark();
    const data: BattleData = {
      enemies: spec.enemies,
      scripted: spec.scripted,
      music: spec.music,
      weather: spec.weather,
      forecast: spec.forecast,
      background: this.map.battle,
      onDone: (outcome: BattleOutcome) => {
        this.afterBattle(outcome, spec.then);
      },
    };
    this.scene.pause();
    launchOver(this, "battle", data);
  }

  private afterBattle(_outcome: BattleOutcome, then: string | null): void {
    this.scene.resume();
    if (then === null) {
      this.free();
      return;
    }
    this.runDialogue(then);
  }

  private playCutscene(action: Extract<Action, { kind: "cutscene" }>): void {
    const data: CutsceneData = {
      title: action.title,
      caption: action.caption,
      still: action.still,
      video: action.video,
      onDone: () => {
        this.runDialogue(action.then);
      },
    };
    getState(this).set(`trope:${action.trope}`);
    launchOver(this, "cutscene", data);
  }

  private playMinigame(action: Extract<Action, { kind: "minigame" }>): void {
    const data: MinigameData = {
      spec: action.spec,
      onDone: (result: MinigameResult) => {
        getState(this).set(`minigame:${action.spec.id}:${result.won ? "won" : "lost"}`);
        this.runDialogue(result.won ? action.onWin : action.onLose);
      },
    };
    launchOver(this, "minigame", data);
  }

  private startChapter(id: string): void {
    const chapter = CAMPAIGN.chapters[id];
    if (chapter === undefined) throw new Error(`no chapter ${id}`);
    const state = getState(this);
    state.chapter = id;
    state.setParty(chapter.party);
    state.healAll();
    this.scene.restart({
      map: chapter.start.map,
      x: chapter.start.x,
      y: chapter.start.y,
    } satisfies OverworldData);
  }
}
