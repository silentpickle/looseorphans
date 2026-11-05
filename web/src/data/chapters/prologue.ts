import type { Chapter } from "../types";

// 20 columns by 11 rows of 32px over a 640x360 screen. '#' blocks, '.' walks; letters place NPCs and warps.
const DORM_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "#########^##########",
  "######S.....B#######",
  "######F..###.C..####",
  "######...###....####",
  "######...###....####",
  "######.I........H.##",
  "####################",
];

const ROOFTOP_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####......L.#.###.##",
  "#...........#.###..#",
  "#..................#",
  "#..................#",
  "#.........v........#",
  "####################",
];

const DORM_SPAWN = { x: 10, y: 9 };
const ROOFTOP_SPAWN = { x: 9, y: 8 };

export const CHAPTER: Chapter = {
  id: "prologue",
  title: "Prologue: The Rooftop",
  party: ["m1", "m2", "m3"],
  start: { map: "dorm", ...DORM_SPAWN },
  maps: {
    dorm: {
      id: "dorm",
      name: "The Dorm",
      backdrop: "backdrop_dorm",
      music: "overworld",
      placeholder: 0x4a3326,
      grid: DORM_GRID,
      onEnter: "dorm_intro",
      npcs: [
        { id: "m7", name: "{m7}", figure: "m7", glyph: "S", dialogue: "m7_dorm" },
        {
          id: "m6",
          name: "{m6}",
          figure: "m6",
          glyph: "F",
          dialogue: "m6_dorm",
          variants: [{ when: "got_brownies", dialogue: "m6_dorm_again" }],
        },
        { id: "m5", name: "{m5}", figure: "m5", glyph: "C", dialogue: "m5_dorm" },
        { id: "m4", name: "{m4}", figure: "m4", glyph: "H", dialogue: "m4_dorm" },
        { id: "m8", name: "{m8}", figure: "m8", glyph: "I", dialogue: "m8_dorm" },
        {
          id: "m3",
          name: "{m3}",
          figure: "m3",
          glyph: "B",
          dialogue: "m3_dorm",
          variants: [{ when: "m3_dorm_done", dialogue: "m3_dorm_again" }],
        },
      ],
      warps: [{ glyph: "^", map: "rooftop", ...ROOFTOP_SPAWN }],
    },
    rooftop: {
      id: "rooftop",
      name: "The Rooftop",
      backdrop: "backdrop_rooftop",
      battle: "rooftop_battle",
      music: "title",
      placeholder: 0x16213e,
      grid: ROOFTOP_GRID,
      onEnter: "rooftop_live",
      npcs: [
        {
          id: "m2",
          name: "{m2}",
          figure: "m2",
          glyph: "L",
          dialogue: "m2_roof",
          facing: "down",
        },
      ],
      warps: [{ glyph: "v", map: "dorm", ...DORM_SPAWN }],
    },
  },
  dialogues: {
    dorm_intro: [
      {
        id: "a",
        text: "The night before the comeback. The dorm smells like brownies and dread.",
      },
      {
        id: "b",
        speaker: "{m1}",
        portrait: "portrait_m1",
        text: "Tonight. I'm telling him tonight. On the rooftop. On the livestream. In front of everyone.",
      },
      { id: "c", speaker: "{m1}", portrait: "portrait_m1", text: "...Okay maybe not in front of everyone." },
      {
        id: "d",
        text: "(Arrow keys or the D-pad to walk. Z, Enter or A to talk. Head up the stairs when you're ready.)",
      },
    ],
    m7_dorm: [
      {
        id: "a",
        speaker: "{m7}",
        text: "{m1}, you've been pacing for forty minutes. The floor is going to file a complaint.",
      },
      { id: "b", speaker: "{m1}", portrait: "portrait_m1", text: "I'm WARMING UP." },
      { id: "c", speaker: "{m7}", text: "For what, a marathon of bad decisions?" },
    ],
    m6_dorm: [
      {
        id: "a",
        speaker: "{m6}",
        text: "Brownies are done! Take some. For courage. Or for {m2}. Or both.",
      },
      {
        id: "b",
        text: "Got 2 {m6}'s Brownies.",
        set: "got_brownies",
        action: { kind: "give", item: "brownie", count: 2 },
      },
    ],
    m6_dorm_again: [{ id: "a", speaker: "{m6}", text: "Good morning. (It's 11pm.)" }],
    m5_dorm: [
      {
        id: "a",
        speaker: "{m5}",
        text: "Confessions are like deadlifts. Don't think. Lift. Scream a little.",
      },
    ],
    m4_dorm: [
      {
        id: "a",
        speaker: "{m4}",
        text: "I painted the mood of this evening. It's mostly orange. You're welcome.",
      },
    ],
    m8_dorm: [
      {
        id: "a",
        speaker: "{m8}",
        text: "As the maknae I legally cannot be blamed for whatever happens tonight.",
      },
    ],
    m3_dorm: [
      {
        id: "a",
        speaker: "{m3}",
        text: "You okay, {m1.given}? The stream starts in five. I'll be right there on the roof.",
        set: "m3_dorm_done",
      },
      {
        id: "b",
        speaker: "{m1}",
        portrait: "portrait_m1",
        text: "I'm fine! Totally fine! Why does everyone keep asking if I'm fine!",
        choices: [
          { text: "Because you're sweating.", next: "c", meter: 1 },
          { text: "Because we love you.", next: "d", meter: 2 },
        ],
      },
      { id: "c", speaker: "{m3}", text: "It's November." },
      { id: "d", speaker: "{m3}", text: "...Go get him." },
    ],
    m3_dorm_again: [
      { id: "a", speaker: "{m3}", text: "Five minutes, {m1.given}. Breathe. I'm right behind you." },
    ],
    rooftop_live: [
      { id: "a", text: "The city hums. A phone on a tripod blinks red. 2.4 million {fandom} are watching." },
      {
        id: "b",
        speaker: "{m3}",
        text: "Hi, everyone! Welcome to the roof. The boys have something to... {m1}? {m1}'s walking over.",
      },
      {
        id: "c",
        speaker: "{m1}",
        portrait: "portrait_m1",
        text: "{m2.given}-hyung. I... there's something I've wanted to say for a really, really long time.",
      },
      { id: "d", speaker: "{m2}", text: "If it's about the cats, they're fine. {cat3} ate your sock." },
      { id: "e", speaker: "{m1}", portrait: "portrait_m1", text: "It's not about the cats. It's about-" },
      {
        id: "f",
        text: "The stream stutters. The sky goes the colour of a contract. A man in a black suit steps out of a glitch.",
      },
      {
        id: "g",
        speaker: "Director Gwi",
        text: "Clause 7, paragraph 2. 'Idols shall not.' Shall not WHAT, Mr. {m1}? Go on. Say it on camera.",
      },
      {
        id: "h",
        speaker: "{m3}",
        text: "Stay behind me, both of you. We've handled worse than a suit.",
      },
      {
        id: "i",
        text: "Director Gwi draws a fountain pen. The Dating Ban Contract unfurls like a banner.",
        action: {
          kind: "battle",
          enemies: ["director_gwi"],
          scripted: "lose",
          music: "boss",
          then: "after_gwi",
        },
      },
    ],
    after_gwi: [
      { id: "a", speaker: "Director Gwi", text: "Hidden feelings taste best. Thank you for the meal." },
      { id: "b", speaker: "{m1}", portrait: "portrait_m1", text: "{m2.given}... hyung..." },
      { id: "c", speaker: "{m2}", text: "{m1.given}, don't you DARE finish that sentence while he's-" },
      {
        id: "d",
        text: "Gwi flicks the pen. The {barrier}, the barrier woven from every song {m1} ever wrote, cracks like glass.",
        action: {
          kind: "cutscene",
          trope: "shatter",
          title: "The {barrier} Shatters",
          still: "still_shatter",
          video: "shatter",
          caption: [
            "Eight boys, flung into eight stories.",
            "Seven Lightstick Shards, scattered across the Dramaverse.",
            "One confession, interrupted.",
          ],
          then: "to_chapter_one",
        },
      },
    ],
    to_chapter_one: [
      {
        id: "a",
        text: "Somewhere, a ferry horn. Somewhere, camellias.",
        action: { kind: "chapter", chapter: "ch1" },
      },
    ],
    m2_roof: [{ id: "a", speaker: "{m2}", text: "...What." }],
  },
};
