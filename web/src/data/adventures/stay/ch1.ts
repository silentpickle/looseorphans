import type { MinigameSpec } from "../../../minigames/types";
import type { Chapter, Enemy } from "../../types";
import { TRACK, VAN_IMAGE } from "./shared";

// The dorm, as the first game's prologue lays it out over the same painting: the kitchen on the left, the sofa on
// the right, the front door at the top. 20 x 11 cells of 32 px.
const DORM_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "#########>##########",
  "######J.....S#######",
  "######L..###.N..####",
  "######...###....####",
  "######...###....####",
  "######.A..........##",
  "####################",
];

// The garage under the dorm: the van against the back wall, the street door at the bottom.
const GARAGE_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "#####..........#####",
  "####.....V......####",
  "####............####",
  "###..............###",
  "###..O...........###",
  "##................##",
  "##................##",
  "##.......<........##",
];

const DORM_SPAWN = { x: 10, y: 9 };
const DORM_FROM_GARAGE = { x: 9, y: 5 };
const GARAGE_SPAWN = { x: 10, y: 8 };
const CREW_READY = "rec_m6&rec_m4&rec_m7&rec_m8";
const SMALL = 48;
const MEDIUM = 64;

const JUMP_START: MinigameSpec = {
  kind: "timing",
  id: "stay_jump_start",
  title: "Jump-start the Banana Van",
  prompt: "Turn the key when the needle hits the green.",
  rounds: 3,
  lives: 2,
  sweepsPerSecond: 0.8,
  window: 0.24,
  invert: false,
};

const ENEMIES: readonly Enemy[] = [
  {
    id: "stay_drone",
    name: "Paparazzi Drone",
    art: "enemy_stay_drone",
    stats: { hp: 26, mp: 0, atk: 8, def: 3, mag: 2, spd: 13 },
    stayPoints: 12,
    color: 0x5a6b7a,
    width: SMALL,
    height: SMALL,
    lines: ["flashes a camera", "buzzes in for a close-up"],
  },
  {
    id: "stay_neighbour",
    name: "Noise Complaint",
    art: "enemy_stay_complaint",
    stats: { hp: 34, mp: 0, atk: 10, def: 4, mag: 3, spd: 8 },
    stayPoints: 16,
    color: 0x7a5a3b,
    width: MEDIUM,
    height: SMALL,
    lines: ["bangs on the ceiling", "slides a strongly worded note"],
  },
];

export const CHAPTER: Chapter = {
  id: "stay1",
  title: "Part 1: The Letter",
  party: ["m3"],
  enemies: ENEMIES,
  speakers: { "Ajumma Lee": "stay_ajumma_lee" },
  start: { map: "dorm", ...DORM_SPAWN },
  maps: {
    dorm: {
      id: "dorm",
      name: "The dorm, early 2027",
      backdrop: "backdrop_dorm",
      music: TRACK.caper,
      placeholder: 0x6a4f3b,
      grid: DORM_GRID,
      onEnter: "dorm_intro",
      npcs: [
        {
          id: "m1",
          name: "{m1}",
          figure: "m1",
          glyph: "S",
          dialogue: "sol_letter",
          variants: [
            { when: CREW_READY, dialogue: "sol_ready" },
            { when: "plan_on", dialogue: "sol_waiting" },
          ],
          hiddenWhen: "crew_ready",
        },
        {
          id: "m6",
          name: "{m6}",
          figure: "m6",
          glyph: "L",
          dialogue: "lio_baking",
          variants: [
            { when: "rec_m6", dialogue: "lio_after" },
            { when: "plan_on", dialogue: "lio_recruit" },
          ],
          hiddenWhen: "crew_ready",
        },
        {
          id: "m4",
          name: "{m4}",
          figure: "m4",
          glyph: "A",
          dialogue: "ari_mirror",
          variants: [
            { when: "rec_m4", dialogue: "ari_after" },
            { when: "plan_on", dialogue: "ari_recruit" },
          ],
        },
        {
          id: "m7",
          name: "{m7}",
          figure: "m7",
          glyph: "J",
          dialogue: "jun_reading",
          variants: [
            { when: "rec_m7", dialogue: "jun_after" },
            { when: "plan_on", dialogue: "jun_recruit" },
          ],
        },
        {
          id: "m8",
          name: "{m8}",
          figure: "m8",
          glyph: "N",
          dialogue: "nico_gaming",
          variants: [
            { when: "rec_m8", dialogue: "nico_after" },
            { when: "plan_on", dialogue: "nico_recruit" },
          ],
        },
      ],
      warps: [{ glyph: ">", map: "garage", requires: "crew_ready", ...GARAGE_SPAWN }],
    },
    garage: {
      id: "garage",
      name: "The garage under the dorm",
      backdrop: "backdrop_stay_garage",
      battle: "stay_street_battle",
      music: TRACK.caper,
      placeholder: 0x3b3f4a,
      grid: GARAGE_GRID,
      onEnter: "garage_intro",
      encounters: { rate: 0.03, groups: [["stay_drone"], ["stay_drone", "stay_neighbour"], ["fancam"]] },
      npcs: [
        {
          id: "van",
          name: "The Banana Van",
          image: VAN_IMAGE,
          glyph: "V",
          dialogue: "van",
          variants: [{ when: "minigame:stay_jump_start:won", dialogue: "van_running" }],
        },
        {
          id: "ajumma_lee",
          name: "Ajumma Lee",
          figure: "npc_ajumma",
          glyph: "O",
          dialogue: "ajumma_letter",
          variants: [{ when: "letter_1", dialogue: "ajumma_after" }],
        },
      ],
      warps: [{ glyph: "<", map: "dorm", ...DORM_FROM_GARAGE }],
    },
  },
  dialogues: {
    dorm_intro: [
      {
        id: "a",
        text: "The dorm, early 2027. One bunk has been made with military corners. Nobody sleeps in it.",
      },
      {
        id: "b",
        speaker: "{m3}",
        text: "Morning, guys. ...Guys? Why is it so quiet? Why is {m1} sitting on the floor holding an envelope?",
      },
      { id: "c", text: "(Talk to {m1}.)" },
    ],
    sol_letter: [
      {
        id: "a",
        speaker: "{m1}",
        text: "It's from {m2.given}-hyung. It came this morning. It has a rabbit sticker on it.",
      },
      {
        id: "b",
        text: "'The food is beige. The sergeant has a whistle. I miss the cats. I miss...' The sentence just stops.",
      },
      {
        id: "c",
        speaker: "{m1}",
        text: "I MISS WHAT, HYUNG. WHAT. I've read it nine times. It doesn't get longer.",
      },
      {
        id: "d",
        speaker: "{m3}",
        text: "...Right. You okay, mate?",
        choices: [
          { text: "{m3} sits down on the floor next to him.", next: "e", meter: 2 },
          { text: "{m3} reads it a tenth time, out loud, in a rabbit voice.", next: "f", meter: 1 },
        ],
      },
      { id: "e", speaker: "{m1}", text: "...No. But thanks for sitting.", next: "g" },
      { id: "f", speaker: "{m1}", text: "That's not funny. ...That's a little funny.", next: "g" },
      {
        id: "g",
        speaker: "{m3}",
        text: "Okay. New plan. Old plan, really. We go and get him. I'm getting the whiteboard.",
        set: "plan_on",
      },
      {
        id: "h",
        speaker: "{m1}",
        text: "Get him? From the ARMY? Hyung, that's not a plan, that's a felony!",
      },
      { id: "i", speaker: "{m3}", text: "That's why it needs a whiteboard. Round up the others." },
    ],
    sol_waiting: [
      {
        id: "a",
        speaker: "{m1}",
        text: "I'm writing him back. 'Dear hyung, we are NOT coming to get you.' That's a code.",
      },
    ],
    sol_ready: [
      { id: "a", speaker: "{m3}", text: "Everyone's in. {stay_team}. Seven of us, one van, zero idea." },
      {
        id: "b",
        speaker: "{m1}",
        text: "I'm in too. Obviously. I'm SO in. Somebody has to finish his sentence.",
      },
      {
        id: "c",
        speaker: "{m6}",
        text: "Good morning! I packed brownies. And I'm driving. Nobody else touches the van.",
      },
      {
        id: "d",
        text: "{m1} and {m6} join the party!",
        set: "crew_ready",
        action: { kind: "party", members: ["m3", "m1", "m6"] },
      },
    ],
    lio_baking: [
      {
        id: "a",
        speaker: "{m6}",
        text: "Good morning! It's 4 p.m. but good morning. Brownie? They're for {m2}. All of them.",
      },
    ],
    lio_recruit: [
      { id: "a", speaker: "{m3}", text: "{m6}. We're going to get {m2}. I need a driver." },
      {
        id: "b",
        speaker: "{m6}",
        text: "I'll drive anything. Anything with WHEELS. Is there a helicopter in this plan?",
      },
      { id: "c", speaker: "{m3}", text: "...No?" },
      { id: "d", speaker: "{m6}", text: "Then I'm in. {stay_fool} And brownies.", set: "rec_m6" },
    ],
    lio_after: [
      { id: "a", speaker: "{m6}", text: "No helicopters. I'm writing it on the whiteboard myself." },
    ],
    ari_mirror: [
      { id: "a", speaker: "{m4}", text: "The light in here is so sad today. It's grey. Grief-grey." },
    ],
    ari_recruit: [
      {
        id: "a",
        speaker: "{m3}",
        text: "We need someone to talk us past a gate. A guardhouse. Probably a sergeant.",
      },
      {
        id: "b",
        speaker: "{m4}",
        text: "You need a face. Luckily, I have one. I'll need a disguise kit and better lighting.",
      },
      { id: "c", text: "{m4} signs on as {stay_m4}.", set: "rec_m4" },
    ],
    ari_after: [
      {
        id: "a",
        speaker: "{m4}",
        text: "I'm practising my 'I'm definitely a delivery man' face. It's working.",
      },
    ],
    jun_reading: [
      {
        id: "a",
        speaker: "{m7}",
        text: "I'm reading the military service act. For fun. Don't look at me like that.",
      },
    ],
    jun_recruit: [
      { id: "a", speaker: "{m3}", text: "{m7}. We're breaking {m2} out." },
      { id: "b", speaker: "{m7}", text: "That is, legally and spiritually, the worst idea you've ever had." },
      {
        id: "c",
        speaker: "{m7}",
        text: "I'm in. Someone needs to read the fine print. Also I can fly things. Small things.",
      },
      { id: "d", text: "{m7} signs on as {stay_m7}.", set: "rec_m7" },
    ],
    jun_after: [
      {
        id: "a",
        speaker: "{m7}",
        text: "Kevin says it's a bad plan too. Kevin is my dog. You can't see him. He's very good.",
      },
    ],
    nico_gaming: [{ id: "a", speaker: "{m8}", text: "One more round. One more. I'm winning, legally." }],
    nico_recruit: [
      { id: "a", speaker: "{m3}", text: "{m8}. Can you fit through an air vent?" },
      {
        id: "b",
        speaker: "{m8}",
        text: "Hyung, I've been fitting through air vents since I was a trainee. Legally.",
      },
      { id: "c", text: "{m8} signs on as {stay_m8}.", set: "rec_m8" },
    ],
    nico_after: [
      { id: "a", speaker: "{m8}", text: "Do I get a codename? I want a cool codename. ...That one's fine." },
    ],
    garage_intro: [
      {
        id: "a",
        text: "Under the dorm, under a tarp: a yellow delivery van with a banana painted on the side.",
      },
      {
        id: "b",
        speaker: "{m6}",
        text: "She hasn't started since the comeback before last. But she's ours.",
      },
    ],
    van: [
      { id: "a", speaker: "{m6}", text: "Okay, baby. Wake up. Wake up for {m2}." },
      {
        id: "b",
        text: "The engine coughs. Somewhere, a neighbour bangs on a pipe.",
        action: { kind: "minigame", spec: JUMP_START, onWin: "van_won", onLose: "van_lost" },
      },
    ],
    van_lost: [
      { id: "a", text: "The van makes a sound like a sad trumpet and stops." },
      { id: "b", speaker: "{m6}", text: "She's just shy. Try again. Gently. Like a brownie." },
    ],
    van_won: [
      {
        id: "a",
        text: "The Banana Van roars. The garage fills with smoke and a faint smell of banana milk.",
      },
      { id: "b", speaker: "{m3}", text: "Everyone. Out here. Now. And wear what I left on your beds." },
      {
        id: "c",
        text: "One by one, the crew walks into the garage.",
        action: {
          kind: "cutscene",
          trope: "stay_crew",
          title: "Caper: The Crew Reveal",
          caption: [
            "A wolf. A quokka. A chick. A ferret. A puppy. A fox.",
            "Six plush animal onesies in a row. The pig is on his way.",
            "{stay_team}. Assembled. Mostly.",
          ],
          still: "still_stay_crew", // no clip: Gemini Omni refused this still (docs/adventures/README.md)
          then: "crew_done",
        },
      },
    ],
    crew_done: [
      { id: "a", text: "Nobody says anything for a while. It's a lot of onesie.", meter: 3 },
      { id: "b", speaker: "{m1}", text: "Where's {m5}-hyung? He's the pig. We need the pig." },
      { id: "c", speaker: "{m3}", text: "At the scrapyard. He says the van needs armour. And a montage." },
      { id: "d", speaker: "{m3}", text: "{stay_catch}", action: { kind: "chapter", chapter: "stay2" } },
    ],
    van_running: [
      { id: "a", speaker: "{m6}", text: "She's purring. Don't touch the radio. The radio is mine." },
    ],
    ajumma_letter: [
      {
        id: "a",
        speaker: "Ajumma Lee",
        text: "You lot again! The postman left this. Rabbit sticker. Wrong box.",
      },
      {
        id: "b",
        text: "'{m1.given}. The sergeant has a whistle and I want to put it in the soup. -{m2.initial}' ... Rabbit Letter 1 collected.",
        set: "letter_1",
        meter: 2,
      },
      { id: "c", speaker: "{m1}", text: "He wrote to ME. Twice. That's... that's twice." },
    ],
    ajumma_after: [
      { id: "a", speaker: "Ajumma Lee", text: "And turn that van down! It sounds like a goose." },
    ],
  },
};
