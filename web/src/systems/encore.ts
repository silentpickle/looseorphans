// What an Encore does, as a list of events. No Phaser: the battle scene animates the events in order.
import type { Encore, EncoreKind } from "../data/encores";
import type { Weather } from "../data/weather";
import type { StatusId } from "./status";
import { inflict } from "./status";
import type { Combatant, Rng } from "./battle";
import { alive, healAmount, heal, hurt, living, pick, strikeAmount } from "./battle";

export type EncoreEventKind = "damage" | "heal" | "status" | "steal";

export interface EncoreEvent {
  targetKey: string;
  kind: EncoreEventKind;
  amount: number;
  status?: StatusId;
}

interface Context {
  encore: Encore;
  actor: Combatant;
  all: Combatant[];
  rng: Rng;
  weather?: Weather | undefined;
}

const DEFAULT_TURNS = 2;

function strike(ctx: Context, target: Combatant): EncoreEvent {
  const amount = strikeAmount(ctx.actor, target, ctx.encore.power, ctx.rng, { weather: ctx.weather });
  hurt(target, amount);
  return { targetKey: target.key, kind: "damage", amount };
}

function attackAll(ctx: Context): EncoreEvent[] {
  return living(ctx.all, "enemy").map((target) => strike(ctx, target));
}

function attackMulti(ctx: Context): EncoreEvent[] {
  const events: EncoreEvent[] = [];
  const hits = ctx.encore.hits ?? 1;
  for (let i = 0; i < hits; i++) {
    const targets = living(ctx.all, "enemy");
    if (targets.length === 0) break;
    events.push(strike(ctx, pick(targets, ctx.rng)));
  }
  return events;
}

function healAll(ctx: Context): EncoreEvent[] {
  const amount = healAmount(ctx.actor.stats, ctx.encore.power);
  return living(ctx.all, "party").map((target) => ({
    targetKey: target.key,
    kind: "heal",
    amount: heal(target, amount),
  }));
}

function statusOn(ctx: Context, targets: Combatant[]): EncoreEvent[] {
  const status = ctx.encore.status;
  if (status === undefined) return [];
  const turns = ctx.encore.statusTurns ?? DEFAULT_TURNS;
  return targets.map((target) => {
    inflict(target, status, turns);
    return { targetKey: target.key, kind: "status", amount: 0, status };
  });
}

function statusEnemies(ctx: Context): EncoreEvent[] {
  return statusOn(ctx, living(ctx.all, "enemy"));
}

function shieldParty(ctx: Context): EncoreEvent[] {
  return statusOn(ctx, living(ctx.all, "party"));
}

function stealAll(ctx: Context): EncoreEvent[] {
  return living(ctx.all, "enemy").map((target) => ({ targetKey: target.key, kind: "steal", amount: 1 }));
}

const BY_KIND: Record<EncoreKind, (ctx: Context) => EncoreEvent[]> = {
  attack_all: attackAll,
  attack_multi: attackMulti,
  heal_all: healAll,
  status_enemies: statusEnemies,
  shield_party: shieldParty,
  steal_all: stealAll,
};

export function performEncore(
  encore: Encore,
  actor: Combatant,
  all: Combatant[],
  rng: Rng,
  weather?: Weather,
): EncoreEvent[] {
  if (!alive(actor)) return [];
  actor.encore = 0;
  return BY_KIND[encore.kind]({ encore, actor, all, rng, weather });
}
