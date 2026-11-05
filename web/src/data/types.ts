// The shapes every chapter is written in. Content is plain data; the scenes interpret it.
import type { MinigameSpec } from "../minigames/types";
import type { StatusId } from "../systems/status";
import type { WeatherId } from "./weather";

export type MemberId = "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7" | "m8";
export type Dir = "up" | "down" | "left" | "right";

export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
}

export type SkillKind = "attack" | "heal";
/** Which stat an attack reads (atk or mag) and which weather scale it takes. */
export type School = "physical" | "magic";
export type Target = "enemy" | "ally";

export interface StatusEffect {
  status: StatusId;
  turns: number;
}

export interface Skill {
  id: string;
  name: string;
  mp: number;
  power: number;
  kind: SkillKind;
  school?: School; // attacks only; physical when absent
  target: Target;
  line: string;
  inflict?: StatusEffect; // on the target
  self?: StatusEffect; // on the user
}

export interface Member {
  id: MemberId;
  name: string;
  job: string;
  stats: Stats;
  skills: readonly string[];
  portrait?: string;
}

export interface Enemy {
  id: string;
  name: string;
  stats: Stats;
  stayPoints: number;
  art?: string; // texture key; the labelled rectangle stands in when it is missing
  tint?: number; // drawn tinted (a true form)
  artScale?: number; // overrides the boss / enemy scale
  color: number;
  width: number;
  height: number;
  lines: readonly string[];
}

export interface Item {
  id: string;
  name: string;
  heal: number;
  line: string;
}

export interface Choice {
  text: string;
  next: string;
  meter?: number;
  set?: string;
}

export type Action =
  | {
      kind: "battle";
      enemies: readonly string[];
      scripted?: "lose";
      music?: string;
      weather?: WeatherId; // the fight starts in this weather
      forecast?: boolean; // the weather changes on every enemy turn
      then: string;
    }
  | {
      kind: "cutscene";
      trope: string;
      title: string;
      caption: readonly string[];
      still?: string;
      video?: string;
      then: string;
    }
  | { kind: "warp"; map: string; x: number; y: number }
  | { kind: "party"; members: readonly MemberId[] }
  | { kind: "give"; item: string; count: number }
  | { kind: "minigame"; spec: MinigameSpec; onWin: string; onLose: string }
  | { kind: "chapter"; chapter: string }
  | { kind: "end"; text: string }
  | { kind: "credits" };

export interface Node {
  id: string;
  /** Branch on the Minsung meter (systems/meter.ts): the node to go to for Ending A or Ending B. */
  ending?: { A: string; B: string };
  speaker?: string;
  portrait?: string;
  text: string;
  next?: string;
  choices?: readonly Choice[];
  set?: string;
  meter?: number;
  action?: Action;
}

export interface Variant {
  when: string;
  dialogue: string;
}

export interface Npc {
  id: string;
  name: string;
  /** An LPC figure (a person). Exactly one of figure and image is set. */
  figure?: string;
  /** A still picture's texture key (a cat on a step), for an NPC that isn't a person. */
  image?: string;
  glyph: string;
  dialogue: string;
  variants?: readonly Variant[];
  facing?: Dir;
  hiddenWhen?: string;
  shownWhen?: string;
}

export interface Warp {
  glyph: string;
  map: string;
  x: number;
  y: number;
  requires?: string;
}

export interface Encounters {
  rate: number;
  groups: readonly (readonly string[])[];
}

export interface MapDef {
  id: string;
  name: string;
  backdrop: string | null;
  battle?: string; // battle background id (art/battles)
  music?: string; // track id (assets/music)
  placeholder: number;
  grid: readonly string[];
  npcs: readonly Npc[];
  warps: readonly Warp[];
  encounters?: Encounters;
  onEnter?: string;
}

/** Someone the party escorts: an LPC figure that trails them on the map while `when` holds. */
export interface Guest {
  figure: string;
  when?: string;
  /** While this holds the guest has wandered off (an NPC stands in for him somewhere on the map). */
  awayWhen?: string;
}

export interface Chapter {
  id: string;
  title: string;
  party: readonly MemberId[];
  /** Items only this chapter hands out (ids must not clash). */
  items?: readonly Item[];
  /** Enemies only this chapter fights (ids must not clash with other chapters'). */
  enemies?: readonly Enemy[];
  /** Speaker name -> portrait id (art/portraits), for this chapter's cast. */
  speakers?: Readonly<Record<string, string>>;
  /** A member's figure for this chapter (an LPC figure id from tools/art/cast/), e.g. a hanbok. */
  costumes?: Partial<Record<MemberId, string>>;
  guest?: Guest;
  start: { map: string; x: number; y: number };
  maps: Record<string, MapDef>;
  dialogues: Record<string, readonly Node[]>;
}
