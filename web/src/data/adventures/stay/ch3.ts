import type { MinigameSpec } from "../../../minigames/types";
import type { Chapter, Enemy } from "../../types";
import { TRACK, VAN_IMAGE } from "./shared";

// The pines outside the camp: the van parked in the trees, the rest of the crew around it, the path to the gate in
// the bottom right corner.
const PINES_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####...D.L..B...####",
  "####............####",
  "###.....V........###",
  "###..............###",
  "##.............T..##",
  "##................##",
  "##.................#",
  "##################>#",
];

// The gatehouse: the barrier and Guard Kang at the top, the vent cover on the left, the goose's patch on the right.
const GATE_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "######....G....#####",
  "######.........#####",
  "##..V...........H.##",
  "##................##",
  "##................##",
  "##................##",
  "##................##",
  "##<#################",
];

const PINES_SPAWN = { x: 6, y: 8 };
const PINES_FROM_GATE = { x: 17, y: 8 };
const GATE_SPAWN = { x: 3, y: 8 };
const SMALL = 48;
const MEDIUM = 64;
const LARGE = 96;

// The vents: one safe turn per junction, the wrong one ends in the officers' shower.
const VENTS: MinigameSpec = {
  kind: "grid",
  id: "stay_vents",
  title: "The Vents",
  rule: "path",
  grid: ["L", "R", "R", "L", "R"],
  moves: 2,
};

const ENEMIES: readonly Enemy[] = [
  {
    id: "stay_goose",
    name: "Guard Goose",
    art: "enemy_stay_goose",
    stats: { hp: 38, mp: 0, atk: 13, def: 5, mag: 2, spd: 13 },
    stayPoints: 20,
    color: 0xe8e8e8,
    width: SMALL,
    height: SMALL,
    lines: ["honks with intent", "bites a shoelace"],
  },
  {
    id: "stay_searchlight",
    name: "Searchlight Wisp",
    art: "enemy_stay_searchlight",
    stats: { hp: 32, mp: 10, atk: 9, def: 4, mag: 12, spd: 10 },
    stayPoints: 20,
    color: 0xf2e6a0,
    width: MEDIUM,
    height: MEDIUM,
    lines: ["shines right in your eyes", "sweeps the fence line"],
  },
  {
    id: "stay_honk",
    name: "Commander Honk",
    art: "boss_stay_honk",
    stats: { hp: 220, mp: 20, atk: 16, def: 9, mag: 10, spd: 14 },
    stayPoints: 180,
    color: 0xffffff,
    width: LARGE,
    height: LARGE,
    lines: ["honks the alarm", "flaps an important wing"],
  },
];

export const CHAPTER: Chapter = {
  id: "stay3",
  title: "Part 3: The Gate",
  party: ["m4", "m8", "m7", "m1"],
  enemies: ENEMIES,
  speakers: { "Guard Kang": "stay_kang" },
  start: { map: "pines", ...PINES_SPAWN },
  maps: {
    pines: {
      id: "pines",
      name: "The pines outside Camp Pinecone",
      backdrop: "backdrop_stay_pines",
      battle: "stay_pines_battle",
      music: TRACK.camp,
      placeholder: 0x2f4a33,
      grid: PINES_GRID,
      onEnter: "pines_intro",
      npcs: [
        {
          id: "m3",
          name: "{m3}",
          figure: "m3",
          glyph: "D",
          dialogue: "dae_briefing",
          variants: [{ when: "honk_done", dialogue: "dae_go" }],
        },
        { id: "m6", name: "{m6}", figure: "m6", glyph: "L", dialogue: "lio_van" },
        { id: "m5", name: "{m5}", figure: "m5", glyph: "B", dialogue: "bo_stretch" },
        {
          id: "van",
          name: "The Banana Van",
          image: VAN_IMAGE,
          glyph: "V",
          dialogue: "van_waiting",
        },
        {
          id: "letter",
          name: "A letter on a pine",
          image: "prop_letter",
          glyph: "T",
          dialogue: "letter_3",
          hiddenWhen: "letter_3",
        },
      ],
      warps: [{ glyph: ">", map: "gate", ...GATE_SPAWN }],
    },
    gate: {
      id: "gate",
      name: "Camp Pinecone, main gate",
      backdrop: "backdrop_stay_gate",
      battle: "stay_pines_battle",
      music: TRACK.camp,
      placeholder: 0x4a5a3b,
      grid: GATE_GRID,
      onEnter: "gate_intro",
      encounters: {
        rate: 0.03,
        groups: [["stay_goose"], ["stay_searchlight"], ["stay_goose", "stay_searchlight"]],
      },
      npcs: [
        {
          id: "kang",
          name: "Guard Kang",
          figure: "npc_cop",
          glyph: "G",
          dialogue: "kang_ari",
          variants: [
            { when: "honk_done", dialogue: "kang_after" },
            { when: "minigame:stay_vents:won", dialogue: "kang_goose" },
            { when: "ari_tried", dialogue: "kang_again" },
          ],
        },
        {
          id: "vent",
          name: "A vent cover",
          image: "prop_stay_vent",
          glyph: "V",
          dialogue: "vent",
          variants: [{ when: "minigame:stay_vents:won", dialogue: "vent_after" }],
        },
        {
          id: "honk",
          name: "Commander Honk",
          image: "boss_stay_honk",
          glyph: "H",
          dialogue: "honk",
          shownWhen: "goose_called",
          hiddenWhen: "honk_done",
        },
      ],
      warps: [{ glyph: "<", map: "pines", ...PINES_FROM_GATE }],
    },
  },
  dialogues: {
    pines_intro: [
      {
        id: "a",
        text: "Pine trees. A chain-link fence. Somewhere behind it, a whistle blows and a hundred boots stop.",
      },
      {
        id: "b",
        speaker: "{m3}",
        text: "{m4}, {m8}, {m7}: you're the gate team. {m1}, go with them. Keep them honest.",
      },
      { id: "c", speaker: "{m1}", text: "I'm the least honest person here. I'm wearing a quokka." },
    ],
    dae_briefing: [
      { id: "a", speaker: "{m3}", text: "{m4} talks. {m8} crawls. {m7}... does whatever {m7} does." },
      { id: "b", speaker: "{m7}", text: "Kevin and I have a plan. It involves a goose." },
      { id: "c", speaker: "{m3}", text: "I didn't hear that. Go." },
    ],
    dae_go: [{ id: "a", speaker: "{m3}", text: "Plan B. It was always plan B. Get in the van." }],
    lio_van: [
      {
        id: "a",
        speaker: "{m6}",
        text: "I'm keeping the engine warm. And the brownies. Mostly the brownies.",
      },
    ],
    bo_stretch: [{ id: "a", speaker: "{m5}", text: "I'm stretching. For the fence. You'll see." }],
    van_waiting: [
      { id: "a", text: "The steel rabbit on the van's grille stares at the fence. It looks ready." },
    ],
    letter_3: [
      {
        id: "a",
        text: "Someone pinned an envelope to this pine. It has a rabbit sticker. It's addressed 'to whoever's coming'.",
      },
      {
        id: "b",
        text: "'I can hear a van that sounds like a goose. If that's you, don't. If that's you, I knew you would. -{m2.initial}' ... Rabbit Letter 3 collected.",
        set: "letter_3",
        meter: 2,
      },
      { id: "c", speaker: "{m1}", text: "He KNEW. He knew we'd come. ...Did he say don't? Doesn't matter." },
    ],
    gate_intro: [
      {
        id: "a",
        text: "The main gate. A barrier arm. A guardhouse. A guard eating a triangle kimbap very slowly.",
      },
    ],
    kang_ari: [
      { id: "a", speaker: "Guard Kang", text: "Halt. Who goes there. Why are you dressed as a... weasel?" },
      {
        id: "b",
        speaker: "{m4}",
        text: "Ferret. Delivery. Banana milk for the whole camp. Courtesy of the Ministry of Morale.",
      },
      {
        id: "c",
        speaker: "Guard Kang",
        text: "There's no Ministry of Morale.",
        choices: [
          { text: "{m4}: 'There is now. You look like you could use it.'", next: "d", meter: 2 },
          { text: "{m4} does the hair flip. In a ferret hood.", next: "e", meter: 1 },
        ],
      },
      {
        id: "d",
        speaker: "Guard Kang",
        text: "...I could use it. But no deliveries on Saturdays.",
        next: "f",
      },
      {
        id: "e",
        speaker: "Guard Kang",
        text: "That shouldn't have worked as well as it did. Still no.",
        next: "f",
      },
      {
        id: "f",
        speaker: "{m8}",
        text: "Hyung. There's a vent over there. Big enough for a fox.",
        set: "ari_tried",
      },
    ],
    kang_again: [
      {
        id: "a",
        speaker: "Guard Kang",
        text: "Still Saturday. Still no. Please stop looking at me like that, weasel.",
      },
    ],
    kang_goose: [
      {
        id: "a",
        speaker: "{m8}",
        text: "(over the radio) I'm in! I'm in the officers' laundry. It smells like soup.",
      },
      { id: "b", speaker: "{m7}", text: "Excuse me, sir. I'd like to report a goose." },
      { id: "c", speaker: "Guard Kang", text: "...A goose." },
      { id: "d", speaker: "{m7}", text: "A very large goose. Hostile. Kevin saw it too." },
      {
        id: "e",
        speaker: "Guard Kang",
        text: "Son, there's no goose... oh no. Oh no, that's the Commander.",
        set: "goose_called",
      },
    ],
    kang_after: [
      {
        id: "a",
        speaker: "Guard Kang",
        text: "You beat the Commander. Nobody beats the Commander. I'm going to lie down.",
      },
    ],
    vent: [
      { id: "a", speaker: "{m8}", text: "Fox goes in. Fox comes out. Legally." },
      {
        id: "b",
        text: "{m8} squeezes into the vent.",
        action: { kind: "minigame", spec: VENTS, onWin: "vents_won", onLose: "vents_lost" },
      },
    ],
    vents_lost: [
      { id: "a", text: "Wrong turn. {m8} drops into the officers' shower. Nobody is in it, thankfully." },
      { id: "b", speaker: "{m8}", text: "I'm fine! I'm clean now! Going again!" },
    ],
    vents_won: [
      { id: "a", text: "Two left turns, three right turns, one sneeze. {m8} is inside Camp Pinecone." },
      { id: "b", speaker: "{m7}", text: "My turn. Watch this. Distraction is an art." },
    ],
    vent_after: [{ id: "a", text: "A little fox-shaped dent in the vent cover." }],
    honk: [
      {
        id: "a",
        text: "A goose the size of a motorbike waddles out from behind the guardhouse. It wears a tiny beret.",
      },
      { id: "b", speaker: "{m7}", text: "I made it up. I made it UP. Kevin, why is it real?" },
      {
        id: "c",
        text: "Commander Honk honks the alarm!",
        action: { kind: "battle", enemies: ["stay_honk"], music: TRACK.boss, then: "honk_won" },
      },
    ],
    honk_won: [
      {
        id: "a",
        text: "Commander Honk sits down on the barrier arm and refuses to get up. The arm does not lift.",
      },
      { id: "b", speaker: "{m4}", text: "The gate's blocked. By a goose. This lighting is terrible." },
      { id: "c", speaker: "{m3}", text: "(over the radio) Stand back from the fence. {m6}, hit it." },
      {
        id: "d",
        text: "From the pines comes the sound of a goose. It is not a goose. It is a van.",
        action: {
          kind: "cutscene",
          trope: "stay_fence",
          title: "Caper: Through the Fence",
          caption: [
            "The Banana Van comes out of the pines at full speed.",
            "The steel rabbit goes through the fence like a hug.",
            "It stops in the kimchi pots behind the mess hall. Gently.",
          ],
          still: "still_stay_fence",
          video: "stay_fence",
          then: "fence_done",
        },
      },
    ],
    fence_done: [
      {
        id: "a",
        text: "Nobody is hurt. Several pots of kimchi have been rehomed.",
        set: "honk_done",
        meter: 3,
      },
      { id: "b", speaker: "{m6}", text: "I'm so sorry. I'm so sorry, kimchi. I'll make you more kimchi." },
      {
        id: "c",
        speaker: "{m1}",
        text: "He's in there. Somewhere. Hyung. We're IN.",
        action: { kind: "chapter", chapter: "stay4" },
      },
    ],
  },
};
