import { CAMPAIGN } from "@campaign";
import { fmtDeep } from "../cast";
import type { Chapter, Item } from "./types";

const ITEM_LIST: readonly Item[] = fmtDeep([
  { id: "brownie", name: "{m6}'s Brownie", heal: 40, line: "eats a brownie" },
  { id: "banana_milk", name: "Banana Milk", heal: 20, line: "drinks banana milk" },
]);

/** The shared items plus every chapter's own. */
export function itemTable(chapters: Readonly<Record<string, Chapter>>): Record<string, Item> {
  const own = Object.values(chapters).flatMap((chapter) => chapter.items ?? []);
  return Object.fromEntries([...ITEM_LIST, ...own].map((item) => [item.id, item]));
}

export const ITEMS: Record<string, Item> = itemTable(CAMPAIGN.chapters);
