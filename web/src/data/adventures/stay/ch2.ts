import type { MinigameSpec } from "../../../minigames/types";
import type { Chapter, Enemy } from "../../types";
import { TRACK, VAN_IMAGE } from "./shared";

// The scrapyard: Bo's welding bay and Mr. Rust's shed along the top, the van and the plan board in the middle, the
// gate to the back yard bottom right.
const YARD_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "###.....B.....R..###",
  "###..............###",
  "##................##",
  "##...V............##",
  "##................##",
  "##.........K......##",
  "##................##",
  "##..............^.##",
];

// The back yard: stacked cars on both sides, the Scrap Hound's kennel at the top.
const BACK_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####......H.....####",
  "####............####",
  "####............####",
  "####............####",
  "####............####",
  "####............####",
  "####............####",
  "####.v..........####",
];

const YARD_SPAWN = { x: 8, y: 9 };
const YARD_FROM_BACK = { x: 15, y: 9 };
const BACK_SPAWN = { x: 7, y: 9 };
const SMALL = 48;
const MEDIUM = 64;
const LARGE = 96;

// Weld along the seams of a rabbit: ears, head, eyes, chin.
const WELD: MinigameSpec = {
  kind: "grid",
  id: "stay_weld",
  title: "The Montage: Weld the Rabbit",
  rule: "trace",
  grid: ["..#...#..", "..#...#..", ".#######.", ".##.#.##.", ".#######.", "..#####.."],
  moves: 3,
};

const ENEMIES: readonly Enemy[] = [
  {
    id: "stay_magnet",
    name: "Junk Magnet",
    art: "enemy_stay_magnet",
    stats: { hp: 36, mp: 0, atk: 11, def: 6, mag: 2, spd: 7 },
    stayPoints: 18,
    color: 0x8a3b3b,
    width: MEDIUM,
    height: SMALL,
    lines: ["pulls your belt buckle", "sticks to the van"],
  },
  {
    id: "stay_tyre",
    name: "Rolling Tyre",
    art: "enemy_stay_tyre",
    stats: { hp: 30, mp: 0, atk: 12, def: 4, mag: 2, spd: 14 },
    stayPoints: 16,
    color: 0x2b2b2b,
    width: SMALL,
    height: SMALL,
    lines: ["rolls over a toe", "bounces off a hubcap"],
  },
  {
    id: "stay_hound",
    name: "Scrap Hound 3000",
    art: "boss_stay_hound",
    stats: { hp: 190, mp: 10, atk: 15, def: 9, mag: 6, spd: 11 },
    stayPoints: 150,
    color: 0x6b6f7a,
    width: LARGE,
    height: LARGE,
    lines: ["barks in binary", "chases its own exhaust"],
  },
];

export const CHAPTER: Chapter = {
  id: "stay2",
  title: "Part 2: The Build",
  party: ["m3", "m1", "m6"],
  enemies: ENEMIES,
  speakers: { "Mr. Rust": "stay_rust" },
  start: { map: "yard", ...YARD_SPAWN },
  maps: {
    yard: {
      id: "yard",
      name: "Rust & Sons Scrapyard",
      backdrop: "backdrop_stay_scrapyard",
      battle: "stay_scrapyard_battle",
      music: TRACK.build,
      placeholder: 0x7a6a4f,
      grid: YARD_GRID,
      onEnter: "yard_intro",
      encounters: { rate: 0.03, groups: [["stay_tyre"], ["stay_magnet"], ["stay_tyre", "stay_tyre"]] },
      npcs: [
        {
          id: "m5",
          name: "{m5}",
          figure: "m5",
          glyph: "B",
          dialogue: "bo_weld",
          variants: [{ when: "weld_done", dialogue: "bo_after" }],
          hiddenWhen: "weld_done",
        },
        {
          id: "rust",
          name: "Mr. Rust",
          figure: "npc_grandpa",
          glyph: "R",
          dialogue: "rust",
          variants: [
            { when: "letter_2", dialogue: "rust_after" },
            { when: "weld_done", dialogue: "rust_letter" },
          ],
        },
        {
          id: "van",
          name: "The Banana Van",
          image: VAN_IMAGE,
          glyph: "V",
          dialogue: "van_bare",
          variants: [{ when: "weld_done", dialogue: "van_armoured" }],
        },
        {
          id: "board",
          name: "The plan board",
          image: "prop_stay_whiteboard",
          glyph: "K",
          dialogue: "board",
          variants: [{ when: "plan_board", dialogue: "board_after" }],
        },
      ],
      warps: [{ glyph: "^", map: "back", requires: "weld_done", ...BACK_SPAWN }],
    },
    back: {
      id: "back",
      name: "The back yard",
      backdrop: "backdrop_stay_backyard",
      battle: "stay_scrapyard_battle",
      music: TRACK.build,
      placeholder: 0x5a4f3b,
      grid: BACK_GRID,
      npcs: [
        {
          id: "hound",
          name: "Scrap Hound 3000",
          image: "boss_stay_hound",
          glyph: "H",
          dialogue: "hound",
          hiddenWhen: "hound_done",
        },
      ],
      warps: [{ glyph: "v", map: "yard", ...YARD_FROM_BACK }],
    },
  },
  dialogues: {
    yard_intro: [
      {
        id: "a",
        text: "Rust & Sons Scrapyard. Stacks of dead cars. Somewhere in the middle, sparks and a pig onesie.",
      },
      {
        id: "b",
        speaker: "{m5}",
        text: "You're late. The van's not going through any fence like that. It needs armour.",
      },
      { id: "c", speaker: "{m3}", text: "Is that true or do you just want a montage?" },
      { id: "d", speaker: "{m5}", text: "Both. Don't think. Weld." },
    ],
    bo_weld: [
      {
        id: "a",
        speaker: "{m5}",
        text: "Banana-yellow plates. Rabbit on the front. For {m2}. Hold the torch steady.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "A rabbit? On the FRONT? Hyung, that's the most romantic thing a van has ever worn.",
      },
      {
        id: "c",
        speaker: "{m5}",
        text: "It's structural. Go.",
        action: { kind: "minigame", spec: WELD, onWin: "weld_won", onLose: "weld_lost" },
      },
    ],
    weld_lost: [
      { id: "a", text: "A seam pops. The rabbit loses an ear." },
      { id: "b", speaker: "{m5}", text: "That's fine. Ears grow back. On rabbits. Probably. Again." },
    ],
    weld_won: [
      { id: "a", text: "The last seam glows and cools. A steel rabbit grins from the front of the van." },
      {
        id: "b",
        text: "Somewhere, a drum kit starts by itself.",
        action: {
          kind: "cutscene",
          trope: "stay_montage",
          title: "Caper: The Montage",
          caption: [
            "Sparks. Goggles. A pig onesie with the sleeves rolled up.",
            "{m6} paints a banana. {m1} paints a very small heart next to it.",
            "Nobody mentions the heart.",
          ],
          still: "still_stay_montage",
          video: "stay_montage",
          then: "montage_done",
        },
      },
    ],
    montage_done: [
      { id: "a", text: "The Banana Van is now an armoured Banana Van.", meter: 3 },
      { id: "b", speaker: "{m5}", text: "I'm coming. Somebody has to lift the van when it gets stuck." },
      { id: "c", speaker: "{m3}", text: "Why would it get stuck?" },
      { id: "d", speaker: "{m5}", text: "Because you planned it." },
      {
        id: "e",
        text: "{m5} joins the party as {stay_m5}!",
        set: "weld_done",
        action: { kind: "party", members: ["m3", "m5", "m6", "m1"] },
      },
    ],
    bo_after: [{ id: "a", speaker: "{m5}", text: "I'm right behind you. Literally. Lift." }],
    rust: [
      { id: "a", speaker: "Mr. Rust", text: "You kids can use the torch. Don't use the torch on my cat." },
      { id: "b", speaker: "Mr. Rust", text: "And stay out of the back yard. That's where the Hound lives." },
    ],
    rust_letter: [
      {
        id: "a",
        speaker: "Mr. Rust",
        text: "Found this taped inside your van's glovebox. Rabbit sticker. You kids and your stickers.",
      },
      {
        id: "b",
        text: "'{m1.given}. I counted the pine trees from my bunk. 112. I'd rather be counting your bad jokes. -{m2.initial}' ... Rabbit Letter 2 collected.",
        set: "letter_2",
        meter: 2,
      },
      {
        id: "c",
        speaker: "{m1}",
        text: "He thinks my jokes are bad. He COUNTS them. That's basically a love letter.",
      },
    ],
    rust_after: [
      { id: "a", speaker: "Mr. Rust", text: "The Hound's a good boy. Mostly. He's 40% good boy." },
    ],
    van_bare: [{ id: "a", speaker: "{m6}", text: "She's running, but she's naked. Don't look at her." }],
    van_armoured: [
      { id: "a", speaker: "{m6}", text: "Look at her. LOOK at her. She could go through a wall." },
    ],
    board: [
      {
        id: "a",
        speaker: "{m3}",
        text: "Right. The plan. Step one: the van. Step two: the gate. Step four: {m2}.",
      },
      { id: "b", speaker: "{m6}", text: "What's step three?" },
      {
        id: "c",
        speaker: "{m3}",
        text: "Step three is... {m1}, you tell them.",
        choices: [
          { text: "{m1}: 'Step three is we don't leave without him.'", next: "d", meter: 2 },
          { text: "{m1}: 'Step three is we improvise and it's FINE.'", next: "e", meter: 1 },
        ],
      },
      { id: "d", speaker: "{m3}", text: "That's the whole plan, really. I'm underlining it.", next: "f" },
      { id: "e", speaker: "{m6}", text: "It's never fine when you say it like that.", next: "f" },
      {
        id: "f",
        speaker: "{m6}",
        text: "And no helicopter. Write it down.",
        choices: [
          { text: "{m3} writes NO HELICOPTER in big letters.", next: "g", meter: 2 },
          { text: "{m3} writes 'helicopter (maybe)' very small.", next: "h", meter: 1 },
        ],
      },
      { id: "g", speaker: "{m6}", text: "Thank you, hyung. I'm going to trust you.", next: "i" },
      { id: "h", speaker: "{m6}", text: "I can see that. I can see the small writing.", next: "i" },
      { id: "i", text: "The plan board is done. It's mostly arrows.", set: "plan_board" },
    ],
    board_after: [{ id: "a", text: "Arrows. One heart. NO HELICOPTER, or possibly 'helicopter (maybe)'." }],
    hound: [
      { id: "a", text: "A robot dog the size of a fridge lifts its head. Its tail is an exhaust pipe." },
      { id: "b", speaker: "{m5}", text: "Okay. Nobody run. Running is cardio and I didn't stretch." },
      {
        id: "c",
        text: "The Scrap Hound 3000 barks in binary!",
        action: { kind: "battle", enemies: ["stay_hound"], music: TRACK.boss, then: "hound_won" },
      },
    ],
    hound_won: [
      { id: "a", text: "The Hound sits. It offers a paw. The paw is a hubcap.", set: "hound_done" },
      {
        id: "b",
        speaker: "Mr. Rust",
        text: "He likes you! Nobody's ever beaten him. Take the back road out. Go.",
      },
      { id: "c", speaker: "{m3}", text: "Next stop: Camp Pinecone. Everybody in the van. Onesies on." },
      {
        id: "d",
        speaker: "{m1}",
        text: "We're coming, hyung.",
        action: { kind: "chapter", chapter: "stay3" },
      },
    ],
  },
};
