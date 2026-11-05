// The adventure this page plays, picked once when the page loads: `?adventure=<id>` in the address, else the one
// chosen last time, else the first game. Every module that imports `@campaign` gets this one, so a different
// adventure means a reload (scenes/select.ts does that).
import { storage } from "../systems/storage";
import { ADVENTURES, DEFAULT_ADVENTURE, adventureById } from "./index";
import type { Adventure } from "./index";
import type { Campaign } from "./types";

export const ADVENTURE_PARAM = "adventure";
export const LAST_ADVENTURE_KEY = "loose-orphans.adventure";

/** The adventure id to play, given the address's query string and the id remembered from last time. */
export function chooseAdventure(search: string, remembered: string | null): string {
  const asked = new URLSearchParams(search).get(ADVENTURE_PARAM);
  if (asked !== null && adventureById(asked) !== undefined) return asked;
  if (remembered !== null && adventureById(remembered) !== undefined) return remembered;
  return DEFAULT_ADVENTURE;
}

function pageSearch(): string {
  return (globalThis as { location?: Location }).location?.search ?? "";
}

/** True when the address names an adventure, so the select screen has already been answered. */
export function adventureAsked(): boolean {
  return new URLSearchParams(pageSearch()).has(ADVENTURE_PARAM);
}

export function rememberAdventure(id: string): void {
  storage()?.setItem(LAST_ADVENTURE_KEY, id);
}

const ACTIVE: Adventure =
  adventureById(chooseAdventure(pageSearch(), storage()?.getItem(LAST_ADVENTURE_KEY) ?? null)) ??
  (ADVENTURES[0] as Adventure);

export const ACTIVE_ADVENTURE: Adventure = ACTIVE;
export const CAMPAIGN: Campaign = ACTIVE.campaign;
