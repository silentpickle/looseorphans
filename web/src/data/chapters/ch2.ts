import type { MinigameSpec } from "../../minigames/types";
import type { Chapter, Enemy } from "../types";

// The arena: sand field, the doll at the top, a starting bar across the middle. 20 x 11 cells of 32 px.
const ARENA_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "#......###.........#",
  "#..G..........H....#",
  "#..................#",
  "#.....######.......#",
  "#..................#",
  "#....Q..........O..#",
  "#........v.........#",
];

// The glass bridge: a deck that widens toward the camera, railings on both sides.
const BRIDGE_GRID: readonly string[] = [
  "#######.....########",
  "#######..F..########",
  "######.......#######",
  "######.......#######",
  "######.......#######",
  "#####.........######",
  "#####.........######",
  "#####.........######",
  "#####...T.....######",
  "####...........#####",
  "####.....v.....#####",
];

const ARENA_SPAWN = { x: 9, y: 8 };
const BRIDGE_SPAWN = { x: 10, y: 8 }; // off the line of the exit below, so a held key doesn't bounce you back
const RED_LIGHT_WON = "minigame:red_light:won";
const DALGONA_WON = "minigame:dalgona:won";
const GLASS_WON = "minigame:glass_bridge:won";

const RED_LIGHT: MinigameSpec = {
  kind: "timing",
  id: "red_light",
  title: "Red Light, Green Light",
  prompt: "Move only while she looks away: press A outside the red.",
  rounds: 5,
  lives: 2,
  sweepsPerSecond: 0.6,
  window: 0.35,
  invert: true,
};

const DALGONA: MinigameSpec = {
  kind: "grid",
  id: "dalgona",
  title: "Dalgona: the Quokka",
  rule: "trace",
  grid: ["..#...#..", ".#######.", ".##.#.##.", ".#######.", "..#####..", "...###..."],
  moves: 3,
};

const GLASS_BRIDGE: MinigameSpec = {
  kind: "grid",
  id: "glass_bridge",
  title: "The Glass Bridge",
  rule: "path",
  grid: ["L", "R", "R", "L", "R", "L", "L"],
  moves: 3,
};

const ENEMIES: readonly Enemy[] = [
  {
    id: "pink_guard",
    name: "Pink Guard",
    stats: { hp: 44, mp: 0, atk: 13, def: 6, mag: 3, spd: 10 },
    stayPoints: 26,
    art: "enemy_pink_guard",
    color: 0xd96c9a,
    width: 64,
    height: 64,
    lines: ["points a triangle at", "says 'Player eliminated' to"],
  },
  {
    id: "algorithm_wisp",
    name: "Algorithm Wisp",
    stats: { hp: 38, mp: 0, atk: 12, def: 4, mag: 10, spd: 15 },
    stayPoints: 24,
    art: "enemy_algorithm",
    color: 0x5a6cd9,
    width: 64,
    height: 64,
    lines: ["recommends something terrible to", "buries the post of"],
  },
  {
    id: "front_manager",
    name: "The Front Manager",
    stats: { hp: 180, mp: 30, atk: 15, def: 9, mag: 11, spd: 12 },
    stayPoints: 160,
    art: "boss_front_manager_boss",
    color: 0x222222,
    width: 96,
    height: 96,
    lines: ["adjusts the schedule against", "files a complaint about", "says 'the game is fair' to"],
  },
];

export const CHAPTER: Chapter = {
  id: "ch2",
  title: "Chapter 2: Squish Game",
  party: ["m2", "m7", "m8"],
  enemies: ENEMIES,
  speakers: { "The Front Manager": "front_manager" },
  start: { map: "arena", ...ARENA_SPAWN },
  maps: {
    arena: {
      id: "arena",
      name: "The Arena",
      backdrop: "backdrop_squish_arena",
      battle: "squish_battle",
      music: "squish",
      grid: ARENA_GRID,
      placeholder: 0xc79a5b,
      onEnter: "arena_intro",
      encounters: {
        rate: 0.03,
        groups: [["pink_guard"], ["algorithm_wisp"], ["pink_guard", "algorithm_wisp"]],
      },
      npcs: [
        {
          id: "guard_circle",
          name: "Pink Guard",
          figure: "npc_pink_guard",
          glyph: "G",
          dialogue: "red_light_rules",
          variants: [{ when: RED_LIGHT_WON, dialogue: "guard_circle_after" }],
        },
        {
          id: "grandpa",
          name: "Grandpa 001",
          figure: "npc_grandpa",
          glyph: "O",
          dialogue: "grandpa",
          variants: [{ when: "got_banana_milk", dialogue: "grandpa_again" }],
        },
        {
          id: "m1_143",
          name: "Player 143",
          figure: "m1_143",
          glyph: "H",
          dialogue: "m1_reunion",
          shownWhen: RED_LIGHT_WON,
          hiddenWhen: "m1_joined",
          facing: "left",
        },
        {
          id: "guard_square",
          name: "Pink Guard",
          figure: "npc_pink_guard",
          glyph: "Q",
          dialogue: "dalgona_rules",
          shownWhen: "m1_joined",
          variants: [{ when: DALGONA_WON, dialogue: "guard_square_after" }],
        },
      ],
      warps: [{ glyph: "v", map: "bridge", requires: DALGONA_WON, ...BRIDGE_SPAWN }],
    },
    bridge: {
      id: "bridge",
      name: "The Glass Bridge",
      backdrop: "backdrop_squish_bridge",
      battle: "squish_battle",
      music: "squish",
      grid: BRIDGE_GRID,
      placeholder: 0x2b3a4a,
      onEnter: "bridge_intro",
      npcs: [
        {
          id: "guard_triangle",
          name: "Pink Guard",
          figure: "npc_pink_guard",
          glyph: "T",
          dialogue: "glass_rules",
          variants: [{ when: GLASS_WON, dialogue: "guard_triangle_after" }],
        },
        {
          id: "front_manager",
          name: "The Front Manager",
          figure: "npc_front_manager",
          glyph: "F",
          dialogue: "front_manager",
          shownWhen: "bridge_done",
          hiddenWhen: "front_done",
          facing: "down",
        },
      ],
      warps: [{ glyph: "v", map: "arena", ...ARENA_SPAWN }],
    },
  },
  dialogues: {
    arena_intro: [
      { id: "a", text: "Meanwhile, on an island nobody can find on a map." },
      { id: "b", text: "A sand field. Pink guards in masks. A giant doll humming to herself." },
      {
        id: "c",
        speaker: "{m2}",
        text: "...I fell asleep on a rooftop and woke up in a playground. Why am I in a tracksuit.",
      },
      {
        id: "d",
        speaker: "{m7}",
        text: "Why are any of us in tracksuits. Why is mine number 456. That's a lot of people ahead of me.",
      },
      { id: "e", speaker: "{m8}", text: "Hyung. The doll is looking at us." },
      {
        id: "f",
        speaker: "{m2}",
        text: "Don't look back. It's like a cat. If you don't look at it, it gets curious and comes over.",
      },
      { id: "g", text: "(Talk to the guard with the circle mask.)" },
    ],
    red_light_rules: [
      { id: "a", speaker: "Pink Guard", text: "Players. The first game is Red Light, Green Light." },
      {
        id: "b",
        speaker: "Pink Guard",
        text: "Move while she looks away. Freeze when she turns. Those who move on red will be... disqualified.",
      },
      { id: "c", speaker: "{m7}", text: "'Disqualified' is doing a lot of work in that sentence." },
      {
        id: "d",
        speaker: "{m2}",
        text: "Fine. I've stood still through worse. Fan meetings.",
        action: { kind: "minigame", spec: RED_LIGHT, onWin: "red_light_won", onLose: "red_light_lost" },
      },
    ],
    red_light_won: [
      {
        id: "a",
        text: "The doll's head turns one last time. Everyone who crossed the line is still standing.",
      },
      {
        id: "b",
        speaker: "{m8}",
        text: "We did it! ...Wait. There's someone else over there. In a green tracksuit. Number 143.",
      },
      {
        id: "c",
        speaker: "{m7}",
        text: "One-four-three. 'I love you' in pager code. Somebody upstairs has a sense of humour.",
      },
      { id: "d", speaker: "{m2}", text: "...That's {m1.given}." },
    ],
    red_light_lost: [
      {
        id: "a",
        speaker: "Pink Guard",
        text: "Movement detected. Players will return to the starting line.",
      },
      { id: "b", speaker: "{m7}", text: "We moved because you said 'detected' in a scary voice. Again." },
    ],
    guard_circle_after: [
      {
        id: "a",
        speaker: "Pink Guard",
        text: "Proceed. The next game will be announced. Probably by me. Again.",
      },
    ],
    grandpa: [
      { id: "a", speaker: "Grandpa 001", text: "Heh. I'm Player 001. I'm just here to have fun." },
      { id: "b", speaker: "{m8}", text: "That's the scariest thing anyone has said on this island." },
      {
        id: "c",
        text: "Grandpa 001 hands {m8} two cartons of banana milk.",
        set: "got_banana_milk",
        action: { kind: "give", item: "banana_milk", count: 2 },
      },
    ],
    grandpa_again: [
      { id: "a", speaker: "Grandpa 001", text: "Have you ever played marbles? No? Good. Don't." },
    ],
    m1_reunion: [
      {
        id: "a",
        speaker: "{m1}",
        text: "{m2.given|upper}-HYUNG? {m7}! Jeongin! You're here! You're real! Are you real? Pinch me. No, don't, I bruise.",
      },
      { id: "b", speaker: "{m2}", text: "You're number 143." },
      {
        id: "c",
        speaker: "{m1}",
        text: "I KNOW. I didn't pick it! They hand them out! It's a coincidence! A coincidence with a pager code!",
      },
      { id: "d", speaker: "{m7}", text: "He's turning the colour of the tracksuit." },
      {
        id: "e",
        speaker: "{m2}",
        text: "...Stay close. If anyone's getting disqualified, it's not you.",
        choices: [
          { text: "{m1}: 'Is that... worry? From you?'", next: "f", meter: 1 },
          { text: "{m1} grabs his sleeve and doesn't let go.", next: "g", meter: 2 },
        ],
      },
      { id: "f", speaker: "{m2}", text: "It's logistics.", next: "h" },
      { id: "g", speaker: "{m2}", text: "...Fine. Sleeve's yours. For now.", next: "h" },
      {
        id: "h",
        text: "{m1} joins the party!",
        set: "m1_joined",
        action: { kind: "party", members: ["m2", "m1", "m7", "m8"] },
      },
    ],
    dalgona_rules: [
      {
        id: "a",
        speaker: "Pink Guard",
        text: "Game two. Dalgona. Carve the shape out of the candy without breaking it.",
      },
      { id: "b", speaker: "{m1}", text: "What shape is mine. Please be the circle. Please be the circle." },
      { id: "c", speaker: "Pink Guard", text: "Yours is a quokka." },
      { id: "d", speaker: "{m1}", text: "WHO MAKES A QUOKKA DALGONA." },
      {
        id: "e",
        speaker: "{m2}",
        text: "Lick the back of it. The sugar softens. Trust me.",
        action: { kind: "minigame", spec: DALGONA, onWin: "dalgona_won", onLose: "dalgona_lost" },
      },
    ],
    dalgona_won: [
      { id: "a", text: "A perfect sugar quokka lifts free. Its little face is smiling." },
      { id: "b", speaker: "{m1}", text: "I'm never eating it. I'm going to frame it. I'm going to name it." },
      { id: "c", speaker: "{m8}", text: "The exit to the south just opened. There's a bridge." },
    ],
    dalgona_lost: [
      { id: "a", text: "Crack. The quokka loses an ear." },
      { id: "b", speaker: "Pink Guard", text: "...We have more candy. Try again." },
    ],
    guard_square_after: [
      {
        id: "a",
        speaker: "Pink Guard",
        text: "The bridge is to the south. Watch your step. That's not advice. That's the game.",
      },
    ],
    bridge_intro: [
      { id: "a", text: "A long bridge of glass panes over a black drop. Lanterns sway on the railings." },
      {
        id: "b",
        speaker: "{m7}",
        text: "Half these panes are tempered glass. Half are regular. I've been doing the math.",
      },
      { id: "c", speaker: "{m1}", text: "And?" },
      {
        id: "d",
        speaker: "{m7}",
        text: "Left. Then right. Then right again. Then left. After that I'm guessing, and I'm never wrong, so assume I'm right.",
        set: "roast_logic",
      },
      { id: "e", speaker: "{m8}", text: "Hyung, your confidence is a medical condition." },
    ],
    glass_rules: [
      {
        id: "a",
        speaker: "Pink Guard",
        text: "Game three. Cross the bridge. Step on the left pane or the right pane. Choose well.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "I'm going to be honest. My legs have stopped listening to me.",
        action: { kind: "minigame", spec: GLASS_BRIDGE, onWin: "glass_won", onLose: "glass_lost" },
      },
    ],
    glass_lost: [
      { id: "a", text: "A pane cracks under {m1}'s foot. {m2} yanks him back by the collar." },
      { id: "b", speaker: "{m2}", text: "That's one. Don't make it two. Start again." },
    ],
    glass_won: [
      { id: "a", text: "Halfway across, {m1} freezes. The drop under the glass goes on forever." },
      {
        id: "b",
        speaker: "{m1}",
        text: "I can't. Hyung, I can't move. I'm sorry, go without me, tell the cats I...",
      },
      { id: "c", speaker: "{m2}", text: "Get on my back." },
      { id: "d", speaker: "{m1}", text: "What?" },
      {
        id: "e",
        speaker: "{m2}",
        text: "Get on my back, {m1.given}. Close your eyes. Count the panes for me.",
        action: {
          kind: "cutscene",
          trope: "piggyback",
          title: "Trope: The Piggyback Ride",
          caption: [
            "{m2} carries {m1} across the glass.",
            "{m1} counts every pane out loud.",
            "He gets the numbers wrong on purpose. {m2} lets him.",
          ],
          still: "still_piggyback",
          video: "piggyback",
          then: "bridge_done",
        },
      },
    ],
    bridge_done: [
      {
        id: "a",
        text: "They reach the far side. {m1} slides down. Neither of them says anything for a while.",
        set: "bridge_done",
        meter: 3,
      },
      { id: "b", speaker: "{m7}", text: "For the record, I was right about the first four." },
      { id: "c", text: "A figure in black waits at the end of the bridge." },
    ],
    guard_triangle_after: [
      { id: "a", speaker: "Pink Guard", text: "...That was against the rules. I'm not reporting it. Go." },
    ],
    front_manager: [
      {
        id: "a",
        speaker: "The Front Manager",
        text: "Players 456, 218, 067 and 143. You carried a player. That is not in the schedule.",
      },
      { id: "b", speaker: "{m1}", text: "Who even ARE you?" },
      {
        id: "c",
        speaker: "The Front Manager",
        text: "I manage the front. Of everything. The Director sends his regards, and his Clause 7.",
      },
      {
        id: "d",
        speaker: "{m2}",
        text: "Tell your Director he can file it with the cat litter.",
        action: { kind: "battle", enemies: ["front_manager"], music: "boss", then: "front_won" },
      },
    ],
    front_won: [
      { id: "a", speaker: "The Front Manager", text: "Impressive. But the game was never fair." },
      {
        id: "b",
        text: "He presses a button. The floor under {m1} opens like a trapdoor.",
        set: "front_done",
      },
      { id: "c", speaker: "{m1}", text: "HYUNG!" },
      { id: "d", speaker: "{m2}", text: "{m1.given|upper}!" },
      {
        id: "e",
        text: "{m2}'s hand closes on air. On the glass where {m1} stood: a folded note and a Lightstick Shard.",
      },
      {
        id: "f",
        text: "'{m2.given}-hyung. You carried me. I was counting wrong on purpose. Did you notice? -{m1.initial}' ... Quokka Note 2 collected. The second Lightstick Shard!",
        set: "note_2",
        meter: 2,
      },
      { id: "g", speaker: "{m8}", text: "He'll be okay. He's {m1}. He always lands somewhere loud." },
      {
        id: "h",
        speaker: "{m2}",
        text: "...Then we'll follow the noise.",
        set: "shard_2",
        action: { kind: "chapter", chapter: "ch3" },
      },
    ],
  },
};
