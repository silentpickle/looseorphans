// A person who awards Minsung meter must not award it again on every talk: either they change what they say once
// their own dialogue has run, or the talk leaves the map (a fight, a minigame, a new chapter).
import { describe, expect, it } from "vitest";
import type { Chapter, Node, Npc } from "../src/data/types";
import { ALL_CHAPTERS } from "./campaigns";

const LEAVES: ReadonlySet<string> = new Set(["battle", "minigame", "chapter", "cutscene", "party", "warp"]);

const awards = (nodes: readonly Node[]): boolean =>
  nodes.some((node) => node.meter !== undefined || (node.choices ?? []).some((c) => c.meter !== undefined));

const leaves = (nodes: readonly Node[]): boolean =>
  nodes.some((node) => node.action !== undefined && LEAVES.has(node.action.kind));

const flagsSet = (nodes: readonly Node[]): string[] =>
  nodes
    .flatMap((node) => [node.set, ...(node.choices ?? []).map((c) => c.set)])
    .filter((f) => f !== undefined);

const terms = (condition: string | undefined): string[] =>
  (condition ?? "").split("&").map((t) => t.trim().replace(/^!/u, ""));

const gatedBy = (npc: Npc, flags: readonly string[]): boolean => {
  const guards = [...(npc.variants ?? []).flatMap((v) => terms(v.when)), ...terms(npc.hiddenWhen)];
  return flags.some((flag) => guards.includes(flag));
};

const npcs = (chapter: Chapter): Npc[] => Object.values(chapter.maps).flatMap((map) => map.npcs);

const repeatsOf = (chapter: Chapter): string[] =>
  npcs(chapter)
    .filter((npc) => {
      const nodes = chapter.dialogues[npc.dialogue] ?? [];
      return awards(nodes) && !leaves(nodes) && !gatedBy(npc, flagsSet(nodes));
    })
    .map((npc) => `${chapter.id}/${npc.id}`);

describe("meter awards", () => {
  it("A1_award_once: no NPC hands out meter again on a repeat talk", () => {
    expect(ALL_CHAPTERS.flatMap(({ chapter }) => repeatsOf(chapter))).toEqual([]);
  });
});
