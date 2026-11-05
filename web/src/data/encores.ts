// Encore moves: one per member, FF's limit break. The gauge fills from damage taken and dealt (systems/battle.ts).
import { fmtDeep } from "../cast";
import type { MemberId } from "./types";
import type { StatusId } from "../systems/status";

export type EncoreKind =
  "attack_all" | "attack_multi" | "heal_all" | "status_enemies" | "shield_party" | "steal_all";

export interface Encore {
  id: string;
  name: string;
  summon?: string; // companion art id (art/companions) drawn when it fires
  kind: EncoreKind;
  power: number;
  hits?: number;
  status?: StatusId;
  statusTurns?: number;
  line: string;
}

const TRIPLE = 3;
const STATUS_TURNS = 2;

export const ENCORES: Record<MemberId, Encore> = fmtDeep({
  m1: {
    id: "m1_enc",
    name: "{en_m1}",
    summon: "quokka",
    kind: "attack_all",
    power: 2.6,
    line: "cooks up a full course for everyone",
  },
  m3: {
    id: "m3_enc",
    name: "{m3.pet}",
    summon: "wolf",
    kind: "shield_party",
    power: 1.2,
    status: "shield",
    statusTurns: STATUS_TURNS,
    line: "howls; the pack closes ranks",
  },
  m2: {
    id: "m2_enc",
    name: "{cats}",
    summon: "bunny",
    kind: "attack_multi",
    power: 1.4,
    hits: TRIPLE,
    line: "unleashes three very unbothered cats on",
  },
  m4: {
    id: "m4_enc",
    name: "Masterpiece",
    summon: "ferret",
    kind: "status_enemies",
    power: 1.0,
    status: "charm",
    statusTurns: STATUS_TURNS,
    line: "paints something so beautiful the enemies switch sides",
  },
  m5: {
    id: "m5_enc",
    name: "{m5.pet} Slam",
    summon: "pig_rabbit",
    kind: "attack_all",
    power: 2.2,
    line: "drops the beat and a pig-rabbit on everyone",
  },
  m6: {
    id: "m6_enc",
    name: "Sunshine",
    summon: "chick",
    kind: "heal_all",
    power: 2.0,
    line: "says 'good morning' and the whole party believes it",
  },
  m7: {
    id: "m7_enc",
    name: "{en_m7}",
    summon: "puppy",
    kind: "status_enemies",
    power: 1.0,
    status: "roasted",
    statusTurns: STATUS_TURNS,
    line: "reads the enemies' entire history out loud",
  },
  m8: {
    id: "m8_enc",
    name: "{m8.pet}",
    summon: "fox",
    kind: "steal_all",
    power: 1.0,
    line: "pickpockets the entire battlefield",
  },
});
