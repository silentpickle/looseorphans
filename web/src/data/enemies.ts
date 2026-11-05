import { CAMPAIGN } from "@campaign";
import type { Chapter, Enemy } from "./types";

const SMALL = 48;
const MEDIUM = 64;
const LARGE = 96;
const ENEMY_LIST: readonly Enemy[] = [
  {
    id: "anti",
    name: "Anti",
    art: "enemy_anti",
    stats: { hp: 28, mp: 0, atk: 9, def: 3, mag: 2, spd: 8 },
    stayPoints: 12,
    color: 0x7a3b4f,
    width: SMALL,
    height: SMALL,
    lines: ["types in all caps", "posts a flop take"],
  },
  {
    id: "commenter",
    name: "Malicious Commenter",
    art: "enemy_commenter",
    stats: { hp: 36, mp: 0, atk: 11, def: 4, mag: 3, spd: 9 },
    stayPoints: 18,
    color: 0x4f3b7a,
    width: MEDIUM,
    height: SMALL,
    lines: ["leaves a 'just my opinion'", "quote-tweets with a sigh"],
  },
  {
    id: "fancam",
    name: "Feral Fancam",
    art: "enemy_fancam",
    stats: { hp: 40, mp: 0, atk: 12, def: 5, mag: 6, spd: 14 },
    stayPoints: 22,
    color: 0x3b6f7a,
    width: MEDIUM,
    height: MEDIUM,
    lines: ["zooms in too close", "loops a four-second clip"],
  },
  {
    id: "director_gwi",
    name: "Director Gwi",
    art: "boss_gwi_demon_boss",
    stats: { hp: 999, mp: 99, atk: 48, def: 40, mag: 30, spd: 14 },
    stayPoints: 0,
    color: 0x1a0b2e,
    width: LARGE,
    height: LARGE,
    lines: ["reads Clause 7 aloud", "signs something in red"],
  },
  {
    id: "jester",
    name: "The Jester",
    art: "boss_jester_boss",
    stats: { hp: 150, mp: 20, atk: 13, def: 8, mag: 10, spd: 11 },
    stayPoints: 120,
    color: 0x8a2a2a,
    width: LARGE,
    height: LARGE,
    lines: ["leaves a riddle on a napkin", "laughs from somewhere behind you"],
  },
];

/** The shared enemies plus every chapter's own. */
export function enemyTable(chapters: Readonly<Record<string, Chapter>>): Record<string, Enemy> {
  const own = Object.values(chapters).flatMap((chapter) => chapter.enemies ?? []);
  return Object.fromEntries([...ENEMY_LIST, ...own].map((enemy) => [enemy.id, enemy]));
}

export const ENEMIES: Record<string, Enemy> = enemyTable(CAMPAIGN.chapters);
