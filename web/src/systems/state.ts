// Everything the story remembers: flags, party, meter, items, hp. One object, held in the Phaser registry.
import { CAMPAIGN } from "@campaign";
import { MEMBERS } from "../data/members";
import type { MemberId } from "../data/types";
import { holds } from "./conditions";
import { clampMeter } from "./meter";

export interface MemberState {
  hp: number;
  mp: number;
}

export interface SaveData {
  chapter: string;
  map: string;
  x: number;
  y: number;
  flags: Record<string, boolean>;
  meter: number;
  stayPoints: number;
  party: MemberId[];
  members: Partial<Record<MemberId, MemberState>>;
  items: Record<string, number>;
}

export class GameState {
  chapter = CAMPAIGN.startChapter;
  map = "";
  x = 0;
  y = 0;
  flags: Record<string, boolean> = {};
  meter = 0;
  stayPoints = 0;
  party: MemberId[] = [];
  members: Partial<Record<MemberId, MemberState>> = {};
  items: Record<string, number> = {};

  has(flag: string): boolean {
    return this.flags[flag] ?? false;
  }

  set(flag: string): void {
    this.flags[flag] = true;
  }

  check(condition: string | undefined): boolean {
    return holds(this.flags, condition);
  }

  addMeter(amount: number): void {
    this.meter = clampMeter(this.meter + amount);
  }

  give(item: string, count: number): void {
    this.items[item] = (this.items[item] ?? 0) + count;
  }

  take(item: string): boolean {
    const left = this.items[item] ?? 0;
    if (left <= 0) return false;
    this.items[item] = left - 1;
    return true;
  }

  member(id: MemberId): MemberState {
    const existing = this.members[id];
    if (existing !== undefined) return existing;
    const fresh = { hp: MEMBERS[id].stats.hp, mp: MEMBERS[id].stats.mp };
    this.members[id] = fresh;
    return fresh;
  }

  setParty(ids: readonly MemberId[]): void {
    this.party = [...ids];
    for (const id of ids) this.member(id);
  }

  healAll(): void {
    for (const id of this.party) {
      this.members[id] = { hp: MEMBERS[id].stats.hp, mp: MEMBERS[id].stats.mp };
    }
  }

  toSave(): SaveData {
    return {
      chapter: this.chapter,
      map: this.map,
      x: this.x,
      y: this.y,
      flags: { ...this.flags },
      meter: this.meter,
      stayPoints: this.stayPoints,
      party: [...this.party],
      members: { ...this.members },
      items: { ...this.items },
    };
  }

  static fromSave(data: SaveData): GameState {
    const state = new GameState();
    Object.assign(state, data);
    return state;
  }
}
