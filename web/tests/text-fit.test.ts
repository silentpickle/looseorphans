// Text that has nowhere to wrap must fit on screen. The game font is monospace (Courier New), so a character budget
// is an exact width check: 14 px text is about 8.4 px per character, 28 px titles about 16.8.
import { describe, expect, it } from "vitest";
import { portraitFor } from "../src/data/art";
import { ENCORES } from "../src/data/encores";
import { MEMBERS } from "../src/data/members";
import { SKILLS } from "../src/data/skills";
import type { Action, Node } from "../src/data/types";
import { enemyAttackText } from "../src/systems/battle";
import { ALL_CHAPTERS, CAMPAIGNS } from "./campaigns";

const BATTLE_MESSAGE = 72; // the one-line message bar across the top of a battle
const CHOICE = 66; // a dialogue choice, in a window as wide as the screen allows
const CAPTION = 74; // a cutscene caption line
const CUTSCENE_TITLE = 36; // 28 px italic
const DIALOGUE_WITH_PORTRAIT = 220; // four wrapped lines beside a portrait
const DIALOGUE_WITHOUT = 270; // four wrapped lines across the whole box

const allNodes = (): { where: string; node: Node; speakers: Readonly<Record<string, string>> }[] =>
  ALL_CHAPTERS.flatMap(({ chapter, speakers }) =>
    Object.entries(chapter.dialogues).flatMap(([name, nodes]) =>
      nodes.map((node) => ({ where: `${chapter.id}/${name}/${node.id}`, node, speakers })),
    ),
  );

const cutscenes = (): { where: string; action: Extract<Action, { kind: "cutscene" }> }[] =>
  allNodes().flatMap(({ where, node }) =>
    node.action?.kind === "cutscene" ? [{ where, action: node.action }] : [],
  );

describe("text fits", () => {
  it("battle messages", () => {
    const members = Object.values(MEMBERS);
    const enemies = CAMPAIGNS.flatMap((tables) => Object.values(tables.enemies));
    for (const member of members) {
      const skills = member.skills.map((id) => SKILLS[id]).filter((skill) => skill !== undefined);
      for (const line of skills.flatMap((skill) =>
        enemies.map((enemy) => `${member.name} ${skill.line} ${enemy.name}!`),
      )) {
        expect(line.length, line).toBeLessThanOrEqual(BATTLE_MESSAGE);
      }
      const encore = `${member.name} ${ENCORES[member.id].line}!`;
      expect(encore.length, encore).toBeLessThanOrEqual(BATTLE_MESSAGE);
    }
    for (const line of enemies.flatMap((enemy) =>
      enemy.lines.flatMap((l) => members.map((m) => enemyAttackText(enemy.name, l, m.name))),
    )) {
      expect(line.length, line).toBeLessThanOrEqual(BATTLE_MESSAGE);
    }
  });

  it("dialogue boxes and choices", () => {
    for (const { where, node, speakers } of allNodes()) {
      const budget =
        (node.portrait ?? portraitFor(node.speaker, speakers)) === undefined
          ? DIALOGUE_WITHOUT
          : DIALOGUE_WITH_PORTRAIT;
      expect(node.text.length, `${where}: ${node.text}`).toBeLessThanOrEqual(budget);
      for (const choice of node.choices ?? [])
        expect(choice.text.length, `${where}: ${choice.text}`).toBeLessThanOrEqual(CHOICE);
    }
  });

  it("cutscene titles and captions", () => {
    for (const { where, action } of cutscenes()) {
      expect(action.title.length, `${where}: ${action.title}`).toBeLessThanOrEqual(CUTSCENE_TITLE);
      for (const line of action.caption)
        expect(line.length, `${where}: ${line}`).toBeLessThanOrEqual(CAPTION);
    }
  });
});
