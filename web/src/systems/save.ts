// The campaign's save and small settings, kept in browser storage (systems/storage.ts).
import { CAMPAIGN } from "@campaign";
import { MEMBERS } from "../data/members";
import { storage } from "./storage";
import type { SaveData } from "./state";

const KEY = CAMPAIGN.saveKey;

export function loadSave(): SaveData | null {
  const store = storage();
  if (store === null) return null;
  const raw = store.getItem(KEY);
  if (raw === null) return null;
  const data = JSON.parse(raw) as SaveData;
  return isCurrent(data) ? data : null;
}

/** A save from before the members got neutral ids names people this build no longer has; it starts over instead. */
function isCurrent(data: SaveData): boolean {
  return data.party.every((id) => id in MEMBERS);
}

export function writeSave(data: SaveData): boolean {
  const store = storage();
  if (store === null) return false;
  store.setItem(KEY, JSON.stringify(data));
  return true;
}

/** A small setting kept between visits (the volume); null when storage is unavailable or it was never set. */
export function readSetting(key: string): string | null {
  return storage()?.getItem(key) ?? null;
}

export function writeSetting(key: string, value: string): void {
  storage()?.setItem(key, value);
}

export function clearSave(): void {
  storage()?.removeItem(KEY);
}
