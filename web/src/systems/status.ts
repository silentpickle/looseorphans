// Status effects. Each one is a small rule in a table; battle.ts asks the table, never switches on names.
import type { Combatant, Rng } from "./battle";

export type StatusId = "stun" | "panic" | "charm" | "shield" | "haste" | "roasted";

export interface Status {
  id: StatusId;
  turns: number;
}

export interface StatusRule {
  name: string;
  /** Multiplies outgoing damage; panic rolls wildly, roasted hits soft. */
  outgoing: (rng: Rng) => number;
  /** Multiplies incoming damage. */
  incoming: number;
  /** Multiplies gauge fill. */
  speed: number;
  /** The combatant loses the turn. */
  skipsTurn: boolean;
  /** The combatant hits an ally instead. */
  turnsOnAllies: boolean;
}

const PANIC_LOW = 0.4;
const PANIC_SPAN = 1.8;
const SHIELD_INCOMING = 0.5;
const HASTE_SPEED = 1.6;
const ROASTED_OUTGOING = 0.6;

const steady = (): number => 1;

export const STATUS_RULES: Record<StatusId, StatusRule> = {
  stun: { name: "Stunned", outgoing: steady, incoming: 1, speed: 1, skipsTurn: true, turnsOnAllies: false },
  panic: {
    name: "Panicking",
    outgoing: (rng) => PANIC_LOW + rng() * PANIC_SPAN,
    incoming: 1,
    speed: 1,
    skipsTurn: false,
    turnsOnAllies: false,
  },
  charm: { name: "Charmed", outgoing: steady, incoming: 1, speed: 1, skipsTurn: false, turnsOnAllies: true },
  shield: {
    name: "Shielded",
    outgoing: steady,
    incoming: SHIELD_INCOMING,
    speed: 1,
    skipsTurn: false,
    turnsOnAllies: false,
  },
  haste: {
    name: "Hasted",
    outgoing: steady,
    incoming: 1,
    speed: HASTE_SPEED,
    skipsTurn: false,
    turnsOnAllies: false,
  },
  roasted: {
    name: "Roasted",
    outgoing: () => ROASTED_OUTGOING,
    incoming: 1,
    speed: 1,
    skipsTurn: false,
    turnsOnAllies: false,
  },
};

export function inflict(target: Combatant, id: StatusId, turns: number): void {
  const existing = target.statuses.find((s) => s.id === id);
  if (existing !== undefined) {
    existing.turns = Math.max(existing.turns, turns);
    return;
  }
  target.statuses.push({ id, turns });
}

export function has(c: Combatant, id: StatusId): boolean {
  return c.statuses.some((s) => s.id === id);
}

export function outgoingScale(c: Combatant, rng: Rng): number {
  return c.statuses.reduce((scale, s) => scale * STATUS_RULES[s.id].outgoing(rng), 1);
}

export function incomingScale(c: Combatant): number {
  return c.statuses.reduce((scale, s) => scale * STATUS_RULES[s.id].incoming, 1);
}

export function speedScale(c: Combatant): number {
  return c.statuses.reduce((scale, s) => scale * STATUS_RULES[s.id].speed, 1);
}

export function skipsTurn(c: Combatant): boolean {
  return c.statuses.some((s) => STATUS_RULES[s.id].skipsTurn);
}

export function turnsOnAllies(c: Combatant): boolean {
  return c.statuses.some((s) => STATUS_RULES[s.id].turnsOnAllies);
}

/** Called once per turn the combatant takes (or loses): every status ticks down and expired ones drop. */
export function endTurn(c: Combatant): void {
  for (const s of c.statuses) s.turns -= 1;
  c.statuses = c.statuses.filter((s) => s.turns > 0);
}
