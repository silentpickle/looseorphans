import type { MinigameSpec } from "../../../minigames/types";
import type { Chapter, Enemy } from "../../types";
import { ONESIES, TRACK } from "./shared";

// Barracks: Rae's bunk and boots on the left, Private Kim on the right, the door to the parade ground below.
const BARRACKS_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "##.B...........K..##",
  "##................##",
  "##................##",
  "##................##",
  "##................##",
  "##................##",
  "##................##",
  "#########>##########",
];

// The parade ground: the Sergeant on his box at the top, the mess hall door top right.
const PARADE_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####.....W.....M####",
  "####............####",
  "##................##",
  "##................##",
  "##................##",
  "##................##",
  "##................##",
  "#########<##########",
];

// The mess hall: the cook at her pots, the crew in onesies at the long tables, the Sergeant's door at the top.
const MESS_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "##..O......W......##",
  "##................##",
  "##..D..S..L..A....##",
  "##................##",
  "##....J..N..B.....##",
  "##................##",
  "##................##",
  "#########v##########",
];

const BARRACKS_SPAWN = { x: 9, y: 7 };
const BARRACKS_FROM_PARADE = { x: 10, y: 8 };
const PARADE_FROM_BARRACKS = { x: 10, y: 8 };
const PARADE_FROM_MESS = { x: 14, y: 5 };
const MESS_SPAWN = { x: 10, y: 8 };
const DRILL_WON = "minigame:stay_drill:won";
const SMALL = 48;
const MEDIUM = 64;
const LARGE = 96;

// Morning drill: left, right, about turn, in step.
const DRILL: MinigameSpec = {
  kind: "rhythm",
  id: "stay_drill",
  title: "Morning Drill: March in Step",
  bpm: 90,
  pattern: [
    "L",
    ".",
    "R",
    ".",
    "L",
    ".",
    "R",
    ".",
    "U",
    ".",
    "U",
    ".",
    "L",
    "R",
    "L",
    "R",
    ".",
    ".",
    "D",
    ".",
    "D",
    ".",
    "L",
    "R",
    "L",
    ".",
    "R",
    ".",
    "U",
    "U",
    "D",
    ".",
  ],
  passScore: 0.6,
};

const ENEMIES: readonly Enemy[] = [
  {
    id: "stay_whistle",
    name: "Sergeant Whistle",
    art: "boss_stay_whistle_boss",
    stats: { hp: 260, mp: 20, atk: 17, def: 10, mag: 8, spd: 12 },
    stayPoints: 200,
    color: 0x4a5a3b,
    width: LARGE,
    height: LARGE,
    lines: ["blows the whistle", "orders twenty push-ups"],
  },
  {
    id: "stay_ladle",
    name: "Runaway Ladle",
    art: "enemy_stay_ladle",
    stats: { hp: 30, mp: 0, atk: 12, def: 5, mag: 2, spd: 12 },
    stayPoints: 18,
    color: 0x9aa5b0,
    width: SMALL,
    height: MEDIUM,
    lines: ["splashes hot soup", "taps you on the head"],
  },
];

export const CHAPTER: Chapter = {
  id: "stay4",
  title: "Part 4: Inside the Camp",
  party: ["m2"],
  enemies: ENEMIES,
  costumes: ONESIES,
  speakers: {
    "Sergeant Whistle": "stay_whistle",
    "Private Kim": "stay_kim",
    "Ajumma Oh": "stay_oh",
  },
  start: { map: "barracks", ...BARRACKS_SPAWN },
  maps: {
    barracks: {
      id: "barracks",
      name: "Camp Pinecone, Barracks 3",
      backdrop: "backdrop_stay_barracks",
      music: TRACK.camp,
      placeholder: 0x5a6b4a,
      grid: BARRACKS_GRID,
      onEnter: "barracks_intro",
      npcs: [
        {
          id: "boot",
          name: "{m2}'s boot",
          image: "prop_stay_boot",
          glyph: "B",
          dialogue: "boot_note",
          variants: [{ when: "letter_4", dialogue: "boot_after" }],
        },
        {
          id: "kim",
          name: "Private Kim",
          figure: "stay_soldier",
          glyph: "K",
          dialogue: "kim",
          variants: [{ when: DRILL_WON, dialogue: "kim_after" }],
        },
      ],
      warps: [{ glyph: ">", map: "parade", ...PARADE_FROM_BARRACKS }],
    },
    parade: {
      id: "parade",
      name: "The parade ground",
      backdrop: "backdrop_stay_parade",
      battle: "stay_camp_battle",
      music: TRACK.camp,
      placeholder: 0x8a7a5a,
      grid: PARADE_GRID,
      npcs: [
        {
          id: "whistle",
          name: "Sergeant Whistle",
          figure: "stay_sergeant",
          glyph: "W",
          dialogue: "drill",
          variants: [{ when: DRILL_WON, dialogue: "drill_after" }],
        },
      ],
      warps: [
        { glyph: "<", map: "barracks", ...BARRACKS_FROM_PARADE },
        { glyph: "M", map: "mess", requires: DRILL_WON, ...MESS_SPAWN },
      ],
    },
    mess: {
      id: "mess",
      name: "The mess hall",
      backdrop: "backdrop_stay_mess",
      battle: "stay_camp_battle",
      music: TRACK.camp,
      placeholder: 0x7a6a5a,
      grid: MESS_GRID,
      onEnter: "mess_intro",
      encounters: { rate: 0.02, groups: [["stay_ladle"], ["stay_ladle", "stay_ladle"]] },
      npcs: [
        { id: "oh", name: "Ajumma Oh", figure: "npc_ajumma", glyph: "O", dialogue: "oh" },
        {
          id: "m1",
          name: "A quokka",
          figure: "stay_m1",
          glyph: "S",
          dialogue: "laugh",
          hiddenWhen: "laugh_done",
        },
        {
          id: "m3",
          name: "A wolf",
          figure: "stay_m3",
          glyph: "D",
          dialogue: "crew_wolf",
          hiddenWhen: "laugh_done",
        },
        {
          id: "m6",
          name: "A chick",
          figure: "stay_m6",
          glyph: "L",
          dialogue: "crew_chick",
          hiddenWhen: "laugh_done",
        },
        { id: "m4", name: "A ferret", figure: "stay_m4", glyph: "A", dialogue: "crew_ferret" },
        { id: "m7", name: "A puppy", figure: "stay_m7", glyph: "J", dialogue: "crew_puppy" },
        { id: "m8", name: "A fox", figure: "stay_m8", glyph: "N", dialogue: "crew_fox" },
        { id: "m5", name: "A pig", figure: "stay_m5", glyph: "B", dialogue: "crew_pig" },
        {
          id: "whistle_mess",
          name: "Sergeant Whistle",
          figure: "stay_sergeant",
          glyph: "W",
          dialogue: "whistle_boss",
          shownWhen: "laugh_done",
          hiddenWhen: "whistle_done",
        },
      ],
      warps: [{ glyph: "v", map: "parade", ...PARADE_FROM_MESS }],
    },
  },
  dialogues: {
    barracks_intro: [
      { id: "a", text: "06:00. Barracks 3. Reveille plays from a speaker that has clearly seen things." },
      { id: "b", speaker: "{m2}", text: "...Morning." },
      {
        id: "c",
        speaker: "Private Kim",
        text: "Good morning, {m2}-ssi! Did you hear the goose last night? Big goose.",
      },
      { id: "d", speaker: "{m2}", text: "That wasn't a goose." },
    ],
    kim: [
      {
        id: "a",
        speaker: "Private Kim",
        text: "Drill in five! The Sergeant's in a mood. Someone hit the kimchi pots with a van.",
      },
      { id: "b", speaker: "{m2}", text: "...A yellow van?" },
      { id: "c", speaker: "Private Kim", text: "How did you know that?" },
    ],
    kim_after: [
      { id: "a", speaker: "Private Kim", text: "You marched like a cat. Like a really disciplined cat." },
    ],
    boot_note: [
      {
        id: "a",
        text: "Something crinkles in {m2}'s left boot. A folded note. Orange marker. A quokka drawn badly in the corner.",
      },
      {
        id: "b",
        text: "'Hyung. Don't panic. Act normal. Eat breakfast. We're in the mess hall. -{m1.initial}'",
        set: "letter_4",
        meter: 2,
      },
      {
        id: "c",
        speaker: "{m2}",
        text: "...He drew himself. With a heart. That's not a quokka, that's a potato.",
      },
      {
        id: "d",
        text: "{m2} puts the note in his breast pocket. The one over his heart. Purely for storage.",
      },
    ],
    boot_after: [{ id: "a", text: "The left boot is empty now. The breast pocket isn't." }],
    drill: [
      {
        id: "a",
        speaker: "Sergeant Whistle",
        text: "FALL IN! Left! Right! Whoever hit my kimchi, I WILL find you!",
      },
      {
        id: "b",
        speaker: "{m2}",
        text: "(Act normal.)",
        action: { kind: "minigame", spec: DRILL, onWin: "drill_won", onLose: "drill_lost" },
      },
    ],
    drill_lost: [
      { id: "a", speaker: "Sergeant Whistle", text: "That was a SHUFFLE! Again! In step!" },
      { id: "b", speaker: "{m2}", text: "...Yes, Sergeant." },
    ],
    drill_won: [
      {
        id: "a",
        speaker: "Sergeant Whistle",
        text: "...Adequate. More than adequate. Mess hall! Breakfast! Move!",
      },
      { id: "b", speaker: "{m2}", text: "(The mess hall. 'We're in the mess hall.')" },
    ],
    drill_after: [
      { id: "a", speaker: "Sergeant Whistle", text: "Why are you smiling, Private? Stop that. Eat." },
    ],
    mess_intro: [
      {
        id: "a",
        text: "The mess hall. Long tables. Beige food. And seven plush animals eating it very, very normally.",
      },
      { id: "b", speaker: "{m2}", text: "..." },
      {
        id: "c",
        text: "The wolf waves. The chick waves. The quokka puts down its spoon and stops breathing.",
      },
    ],
    oh: [
      {
        id: "a",
        speaker: "Ajumma Oh",
        text: "New recruits came in this morning. Very small. Very fluffy. They said 'thank you'.",
      },
      { id: "b", speaker: "Ajumma Oh", text: "Nobody says thank you. I gave the fox extra." },
    ],
    crew_wolf: [
      {
        id: "a",
        speaker: "A wolf",
        text: "(whispering) Act normal. We're new recruits. Very normal recruits.",
      },
    ],
    crew_chick: [
      {
        id: "a",
        speaker: "A chick",
        text: "(whispering) Good morning! I brought you a brownie! Don't look at it!",
      },
    ],
    crew_ferret: [
      { id: "a", speaker: "A ferret", text: "The light in here is so beige. I'm going to cry. Hi." },
    ],
    crew_puppy: [
      { id: "a", speaker: "A puppy", text: "Kevin says hi. Kevin is under the table. He's very good." },
    ],
    crew_fox: [{ id: "a", speaker: "A fox", text: "I got extra soup. Legally." }],
    crew_pig: [{ id: "a", speaker: "A pig", text: "Your squats are getting better. I can tell. Lift." }],
    laugh: [
      {
        id: "a",
        speaker: "A quokka",
        text: "H-hi. Hyung. Hi. Don't panic. I'm not panicking. You're panicking.",
      },
      { id: "b", speaker: "{m2}", text: "{m1.given}. You're wearing a quokka." },
      {
        id: "c",
        speaker: "{m1}",
        text: "You wrote 'I miss' and then you STOPPED. You can't just STOP, hyung.",
        choices: [
          { text: "{m2}: '...You. I miss you. Obviously.'", next: "d", meter: 2 },
          { text: "{m2}: '...The cats. I miss the cats.'", next: "e", meter: 1 },
        ],
      },
      { id: "d", speaker: "{m1}", text: "...Oh. Okay. Okay okay okay. I'm fine. I'm FINE.", next: "f" },
      { id: "e", speaker: "{m1}", text: "HYUNG.", next: "f" },
      {
        id: "f",
        text: "And then, in the middle of the mess hall, Private {m2} starts to laugh.",
        action: {
          kind: "cutscene",
          trope: "stay_laugh",
          title: "Caper: The Laugh",
          caption: [
            "Seven plush animals at a mess hall table.",
            "{m2} laughs out loud. The whole hall turns to look.",
            "It's the first time he's laughed since he got here.",
          ],
          still: "still_stay_laugh",
          video: "stay_laugh",
          then: "laugh_done",
        },
      },
    ],
    laugh_done: [
      { id: "a", text: "{m2} wipes his eyes. The quokka is holding his sleeve.", meter: 3 },
      { id: "b", speaker: "{m3}", text: "Right. Extraction. Quiet and calm." },
      { id: "c", text: "A whistle blows. It is not quiet. It is not calm." },
      {
        id: "d",
        text: "{m1}, {m3} and {m6} fall in beside {m2}!",
        set: "laugh_done",
        action: { kind: "party", members: ["m2", "m1", "m3", "m6"] },
      },
    ],
    whistle_boss: [
      { id: "a", speaker: "Sergeant Whistle", text: "PRIVATE. Why is there a WOLF at my table?" },
      { id: "b", speaker: "{m2}", text: "...New recruit, Sergeant." },
      { id: "c", speaker: "Sergeant Whistle", text: "And the QUOKKA?" },
      { id: "d", speaker: "{m2}", text: "He's with me." },
      {
        id: "e",
        text: "Sergeant Whistle blows the whistle!",
        action: { kind: "battle", enemies: ["stay_whistle"], music: TRACK.boss, then: "whistle_won" },
      },
    ],
    whistle_won: [
      {
        id: "a",
        text: "The Sergeant runs out of breath. He sits on a bench and holds up a hand.",
        set: "whistle_done",
      },
      { id: "b", speaker: "Sergeant Whistle", text: "...I need. A moment. Nobody. Move." },
      { id: "c", speaker: "{m3}", text: "Everybody move. Motor pool. Now." },
      { id: "d", speaker: "{m1}", text: "Hyung, run!", action: { kind: "chapter", chapter: "stay5" } },
    ],
  },
};
