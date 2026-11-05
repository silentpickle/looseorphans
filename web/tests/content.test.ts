// Every chapter's data resolves, in both games: dialogue ids, warps, enemies, skills, figures, and the map glyphs.
import { describe, expect, it } from "vitest";
import { MEMBERS } from "../src/data/members";
import { SKILLS } from "../src/data/skills";
import type { Action, Chapter, Node } from "../src/data/types";
import { ALL_CHAPTERS, CAMPAIGNS } from "./campaigns";
import type { CampaignTables } from "./campaigns";

const COLUMNS = 20;
const ROWS = 11;

function actionTargets(tables: CampaignTables, chapter: Chapter, action: Action, where: string): void {
  if (action.kind === "battle") {
    for (const id of action.enemies) expect(tables.enemies[id], `${where} enemy ${id}`).toBeDefined();
    expect(chapter.dialogues[action.then], `${where} then ${action.then}`).toBeDefined();
  }
  if (action.kind === "cutscene")
    expect(chapter.dialogues[action.then], `${where} then ${action.then}`).toBeDefined();
  if (action.kind === "warp") expect(chapter.maps[action.map], `${where} warp ${action.map}`).toBeDefined();
  if (action.kind === "give") expect(tables.items[action.item], `${where} item ${action.item}`).toBeDefined();
  if (action.kind === "minigame") {
    expect(chapter.dialogues[action.onWin], `${where} onWin`).toBeDefined();
    expect(chapter.dialogues[action.onLose], `${where} onLose`).toBeDefined();
  }
  if (action.kind === "chapter")
    expect(tables.campaign.chapters[action.chapter], `${where} chapter ${action.chapter}`).toBeDefined();
}

function nodeTargets(
  tables: CampaignTables,
  chapter: Chapter,
  nodes: readonly Node[],
  node: Node,
  where: string,
): void {
  const ids = new Set(nodes.map((n) => n.id));
  if (node.next !== undefined) expect(ids.has(node.next), `${where} next ${node.next}`).toBe(true);
  if (node.ending !== undefined) {
    expect(ids.has(node.ending.A), `${where} ending A ${node.ending.A}`).toBe(true);
    expect(ids.has(node.ending.B), `${where} ending B ${node.ending.B}`).toBe(true);
  }
  for (const choice of node.choices ?? [])
    expect(ids.has(choice.next), `${where} choice ${choice.next}`).toBe(true);
  if (node.action !== undefined) actionTargets(tables, chapter, node.action, where);
}

function glyphCount(grid: readonly string[], glyph: string): number {
  return grid.join("").split(glyph).length - 1;
}

describe.each(ALL_CHAPTERS)("$campaign.id chapter $chapter.id", (tables) => {
  const { chapter } = tables;
  it("has a valid start and party", () => {
    expect(chapter.maps[chapter.start.map]).toBeDefined();
    for (const id of chapter.party) expect(MEMBERS[id]).toBeDefined();
  });

  it("dialogue graph resolves", () => {
    for (const [name, nodes] of Object.entries(chapter.dialogues)) {
      expect(nodes.length, name).toBeGreaterThan(0);
      for (const node of nodes) nodeTargets(tables, chapter, nodes, node, `${name}/${node.id}`);
    }
  });

  it.each(Object.values(chapter.maps))("map $id is well formed", (map) => {
    expect(map.grid.length).toBe(ROWS);
    for (const row of map.grid) expect(row.length).toBe(COLUMNS);
    if (map.onEnter !== undefined) expect(chapter.dialogues[map.onEnter]).toBeDefined();
    for (const npc of map.npcs) {
      expect(glyphCount(map.grid, npc.glyph), `${map.id} glyph ${npc.glyph}`).toBe(1);
      expect(
        [npc.figure, npc.image].filter((v) => v !== undefined),
        `${map.id} ${npc.id} figure or image`,
      ).toHaveLength(1);
      expect(chapter.dialogues[npc.dialogue], `${map.id} ${npc.id} dialogue`).toBeDefined();
      for (const variant of npc.variants ?? []) expect(chapter.dialogues[variant.dialogue]).toBeDefined();
    }
    for (const warp of map.warps) {
      expect(glyphCount(map.grid, warp.glyph), `${map.id} warp ${warp.glyph}`).toBe(1);
      expect(chapter.maps[warp.map], `${map.id} warp to ${warp.map}`).toBeDefined();
    }
    for (const group of map.encounters?.groups ?? [])
      for (const id of group) expect(tables.enemies[id]).toBeDefined();
  });
});

describe.each(CAMPAIGNS)("campaign $campaign.id", ({ campaign }) => {
  it("starts in a chapter it plays", () => {
    expect(campaign.order[0]).toBe(campaign.startChapter);
    expect(Object.keys(campaign.chapters).sort()).toEqual([...campaign.order].sort());
  });

  it("gives every enemy and item its own id", () => {
    const chapters = Object.values(campaign.chapters);
    const enemies = chapters.flatMap((chapter) => (chapter.enemies ?? []).map((enemy) => enemy.id));
    const items = chapters.flatMap((chapter) => (chapter.items ?? []).map((item) => item.id));
    expect(new Set(enemies).size).toBe(enemies.length);
    expect(new Set(items).size).toBe(items.length);
  });
});

describe("members", () => {
  it("every skill exists", () => {
    for (const member of Object.values(MEMBERS))
      for (const id of member.skills) expect(SKILLS[id], id).toBeDefined();
  });
});
