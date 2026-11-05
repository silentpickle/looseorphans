// The battle rules, with no Phaser in them: ATB gauges, damage, healing, who acts next, how it ends.
import { ENEMIES } from "../data/enemies";
import { MEMBERS } from "../data/members";
import type { MemberId, School, Stats } from "../data/types";
import type { Weather } from "../data/weather";
import type { Status } from "./status";
import { incomingScale, outgoingScale, speedScale } from "./status";

export const GAUGE_FULL = 1000;
const GAUGE_PER_SPEED_MS = 0.03; // gauge units per speed point per millisecond: speed 12 fills in ~2.8 s
const ATTACK_MULTIPLIER = 2;
const MIN_DAMAGE = 1;
const VARIANCE = 0.15;
const VARIANCE_SPAN = 0.3; // both sides of VARIANCE
const HEAL_BASE = 2.5;
export const ENCORE_FULL = 100;
// Tuned by simulation (2026-11-02): fights last about 5 to 16 actions, so at the old 0.6 / 0.25 no gauge ever filled.
// At these a boss fight fills one by its second half; a two-guard random fight usually stays short of it.
const ENCORE_PER_DAMAGE_TAKEN = 3; // encore points per hp lost
const ENCORE_PER_DAMAGE_DEALT = 1.25;

export type Side = "party" | "enemy";
export type Outcome = "won" | "lost" | null;
export type Rng = () => number; // [0, 1)

export interface Combatant {
  key: string;
  name: string;
  side: Side;
  stats: Stats;
  hp: number;
  mp: number;
  gauge: number;
  encore: number;
  statuses: Status[];
  memberId?: MemberId;
  enemyId?: string;
}

export function alive(c: Combatant): boolean {
  return c.hp > 0;
}

export function partyCombatant(id: MemberId, hp: number, mp: number): Combatant {
  const member = MEMBERS[id];
  return {
    key: `party:${id}`,
    name: member.name,
    side: "party",
    stats: member.stats,
    hp,
    mp,
    gauge: 0,
    encore: 0,
    statuses: [],
    memberId: id,
  };
}

export function enemyCombatant(id: string, index: number): Combatant {
  const enemy = ENEMIES[id];
  if (enemy === undefined) throw new Error(`unknown enemy ${id}`);
  return {
    key: `enemy:${id}:${index}`,
    name: enemy.name,
    side: "enemy",
    stats: enemy.stats,
    hp: enemy.stats.hp,
    mp: enemy.stats.mp,
    gauge: 0,
    encore: 0,
    statuses: [],
    enemyId: id,
  };
}

export function tick(all: Combatant[], deltaMs: number, weather?: Weather): void {
  const sky = weather?.speedScale ?? 1;
  for (const c of all) {
    if (!alive(c)) continue;
    c.gauge = Math.min(
      GAUGE_FULL,
      c.gauge + c.stats.spd * speedScale(c) * sky * GAUGE_PER_SPEED_MS * deltaMs,
    );
  }
}

export function ready(all: Combatant[]): Combatant | undefined {
  return all.find((c) => alive(c) && c.gauge >= GAUGE_FULL);
}

function variance(rng: Rng): number {
  return 1 - VARIANCE + rng() * VARIANCE_SPAN;
}

export function damage(
  attacker: Stats,
  defender: Stats,
  power: number,
  rng: Rng,
  school: School = "physical",
): number {
  const offence = school === "magic" ? attacker.mag : attacker.atk;
  const base = offence * ATTACK_MULTIPLIER - defender.def;
  return Math.max(MIN_DAMAGE, Math.round(base * power * variance(rng)));
}

export interface StrikeOptions {
  weather?: Weather | undefined;
  school?: School | undefined;
}

/** damage() with statuses and weather folded in: what the scene should actually deal. */
export function strikeAmount(
  attacker: Combatant,
  target: Combatant,
  power: number,
  rng: Rng,
  options: StrikeOptions = {},
): number {
  const { weather, school = "physical" } = options;
  const sky = (school === "magic" ? weather?.magicScale : weather?.attackScale) ?? 1;
  const scale = outgoingScale(attacker, rng) * incomingScale(target) * sky;
  return Math.max(MIN_DAMAGE, Math.round(damage(attacker.stats, target.stats, power, rng, school) * scale));
}

/** Both sides' Encore gauges move on every hit; only party members spend theirs. */
export function chargeEncore(attacker: Combatant, target: Combatant, amount: number): void {
  target.encore = Math.min(ENCORE_FULL, target.encore + amount * ENCORE_PER_DAMAGE_TAKEN);
  attacker.encore = Math.min(ENCORE_FULL, attacker.encore + amount * ENCORE_PER_DAMAGE_DEALT);
}

export function encoreReady(c: Combatant): boolean {
  return c.encore >= ENCORE_FULL;
}

export function healAmount(caster: Stats, power: number): number {
  return Math.round(caster.mag * HEAL_BASE * power);
}

export function hurt(target: Combatant, amount: number): void {
  target.hp = Math.max(0, target.hp - amount);
}

export function heal(target: Combatant, amount: number): number {
  const before = target.hp;
  target.hp = Math.min(target.stats.hp, target.hp + amount);
  return target.hp - before;
}

export function living(all: Combatant[], side: Side): Combatant[] {
  return all.filter((c) => c.side === side && alive(c));
}

export function outcome(all: Combatant[]): Outcome {
  if (living(all, "enemy").length === 0) return "won";
  if (living(all, "party").length === 0) return "lost";
  return null;
}

/** Lines that end on one of these take the target straight after ("points a triangle at Sol!"). */
const TARGET_WORDS: ReadonlySet<string> = new Set([
  "at",
  "on",
  "onto",
  "to",
  "near",
  "of",
  "about",
  "against",
  "for",
  "with",
]);
const LINE_END = /[\s.!?]+$/u;

function endsOnTargetWord(line: string): boolean {
  const words = line.replace(LINE_END, "").toLowerCase().split(/\s+/u);
  return TARGET_WORDS.has(words.at(-1) ?? "");
}

/** What the message bar says when an enemy acts: a line that points somewhere names the target, a whole sentence doesn't. */
export function enemyAttackText(enemyName: string, line: string, targetName: string): string {
  if (endsOnTargetWord(line)) return `${enemyName} ${line} ${targetName}!`;
  return `${enemyName} ${line.replace(LINE_END, "")}. ${targetName} takes it!`;
}

export function pick<T>(options: readonly T[], rng: Rng): T {
  const chosen = options[Math.floor(rng() * options.length)];
  if (chosen === undefined) throw new Error("pick from an empty list");
  return chosen;
}

export function spoils(all: Combatant[]): number {
  return all
    .filter((c) => c.side === "enemy")
    .reduce((sum, c) => sum + (c.enemyId === undefined ? 0 : (ENEMIES[c.enemyId]?.stayPoints ?? 0)), 0);
}
