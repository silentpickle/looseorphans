import type { Chapter } from "../types";

// The Pixen street: buildings left and right, sea wall along the top, the walkable street in the middle and
// along the bottom. 20 columns by 11 rows of 32px over the 640x360 screen.
const STREET_GRID: readonly string[] = [
  "####################",
  "######.........#####",
  "######.A.......#####",
  "######.....Y...#####",
  "#####..........#####",
  "######.........#####",
  "####...D....J..#####",
  "####....B..........^",
  "####..........######",
  "....................",
  "....C.........######",
];

const HARBOR_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "###########H########",
  "#.......##.......###",
  "#...v.............##",
  "####################",
];

const STREET_SPAWN = { x: 9, y: 9 };
const HARBOR_SPAWN = { x: 4, y: 8 };
const THREE_CLUES = "clue_napkin&clue_sock&clue_laugh";

export const CHAPTER: Chapter = {
  id: "ch1",
  title: "Chapter 1: Where the Camilla Blooms",
  party: ["m3", "m6", "m4"],
  start: { map: "street", ...STREET_SPAWN },
  maps: {
    street: {
      id: "street",
      name: "Ongsang, by the Camilla",
      backdrop: "backdrop_ongsang_street",
      battle: "ongsang_battle",
      music: "ongsang",
      placeholder: 0xb8956a,
      grid: STREET_GRID,
      onEnter: "ongsang_intro",
      encounters: { rate: 0.03, groups: [["anti"], ["anti", "commenter"], ["fancam"]] },
      npcs: [
        {
          id: "dongbaek",
          name: "Dong-baek-ish",
          figure: "npc_woman",
          glyph: "D",
          dialogue: "dongbaek",
          variants: [
            { when: "jester_done", dialogue: "dongbaek_after" },
            { when: THREE_CLUES, dialogue: "dongbaek_ready" },
          ],
        },
        {
          id: "yongsick",
          name: "Officer Yong-sick",
          figure: "npc_cop",
          glyph: "Y",
          dialogue: "yongsick",
          variants: [{ when: "jester_done", dialogue: "yongsick_after" }],
        },
        {
          id: "ajumma_a",
          name: "Ajumma Kwak",
          figure: "npc_ajumma",
          glyph: "A",
          dialogue: "ajumma_a",
          variants: [{ when: "clue_napkin", dialogue: "ajumma_a_again" }],
        },
        {
          id: "ajumma_b",
          name: "Ajumma Bae",
          figure: "npc_ajumma",
          glyph: "B",
          dialogue: "ajumma_b",
          variants: [{ when: "clue_sock", dialogue: "ajumma_b_again" }],
        },
        {
          id: "ajumma_c",
          name: "Ajumma Choi",
          figure: "npc_ajumma",
          glyph: "C",
          dialogue: "ajumma_c",
          variants: [{ when: "clue_laugh", dialogue: "ajumma_c_again" }],
        },
        {
          id: "jester",
          name: "???",
          figure: "npc_jester",
          glyph: "J",
          dialogue: "jester",
          shownWhen: THREE_CLUES,
          hiddenWhen: "jester_done",
        },
      ],
      warps: [{ glyph: "^", map: "harbor", requires: "jester_done", ...HARBOR_SPAWN }],
    },
    harbor: {
      id: "harbor",
      name: "Ongsang Harbor",
      backdrop: "backdrop_ongsang_harbor",
      music: "ongsang",
      placeholder: 0x2b5d8a,
      grid: HARBOR_GRID,
      onEnter: "harbor_intro",
      npcs: [{ id: "m1_ferry", name: "???", figure: "m1", glyph: "H", dialogue: "m1_ferry", facing: "up" }],
      warps: [{ glyph: "v", map: "street", ...STREET_SPAWN }],
    },
  },
  dialogues: {
    ongsang_intro: [
      {
        id: "a",
        text: "A seaside town. Red camellias in pots. A bar called CAMILLA, which is not how you spell it.",
      },
      {
        id: "b",
        speaker: "{m6}",
        text: "{m3.nick}-hyung? {m4}? Oh thank god. Where's everyone else? Where's {m1}?",
      },
      {
        id: "c",
        speaker: "{m3}",
        text: "Scattered. We find the shard here, we find the others. Stick together.",
      },
      {
        id: "d",
        speaker: "{m4}",
        text: "The lighting here is incredible. Someone is clearly in love in this town.",
      },
      { id: "e", text: "(Talk to everyone. Something is wrong in Ongsang.)" },
    ],
    dongbaek: [
      {
        id: "a",
        speaker: "Dong-baek-ish",
        text: "W-welcome to Camilla. Please don't be a critic. Or a Jester. There's a Jester.",
      },
      { id: "b", speaker: "{m3}", text: "A jester?" },
      {
        id: "c",
        speaker: "Dong-baek-ish",
        text: "He leaves notes. 'Don't laugh.' Everyone's scared. The ajummas know more than they say.",
      },
    ],
    dongbaek_ready: [
      {
        id: "a",
        speaker: "Dong-baek-ish",
        text: "You found all three clues? Then... he's here. Behind the camellias. He's always behind the camellias.",
      },
    ],
    dongbaek_after: [
      {
        id: "a",
        speaker: "Dong-baek-ish",
        text: "You did it. Ongsang can laugh again. Take this, it fell out of his hat. It glows.",
      },
      { id: "b", text: "Got the first Lightstick Shard!", set: "shard_1" },
      { id: "c", speaker: "{m6}", text: "One down. Six to go. Also I'm keeping the hat." },
      {
        id: "d",
        speaker: "Dong-baek-ish",
        text: "There's a ferry at the harbor. A boy in an orange hoodie was asking about you.",
      },
    ],
    yongsick: [
      {
        id: "a",
        speaker: "Officer Yong-sick",
        text: "DONG-BAEK-SSI! I LOVE YOU! ...Oh. Visitors. I love her. I say it every day. Loudly. In public.",
      },
      { id: "b", speaker: "{m4}", text: "Does it work?" },
      {
        id: "c",
        speaker: "Officer Yong-sick",
        text: "NOT YET! But a feeling kept quiet is a feeling that rots. Say it or lose it.",
      },
      { id: "d", speaker: "{m3}", text: "...{m1} needs to meet this guy." },
    ],
    yongsick_after: [
      {
        id: "a",
        speaker: "Officer Yong-sick",
        text: "You DECLARED it! I felt it from across town! Keep that. Use it. Somebody in your group needs it.",
      },
    ],
    ajumma_a: [
      {
        id: "a",
        speaker: "Ajumma Kwak",
        text: "The Jester? Leaves a napkin with a riddle. Always from Camilla. Folded twice.",
      },
      { id: "b", text: "Clue found: the folded napkin.", set: "clue_napkin", meter: 1 },
    ],
    ajumma_a_again: [{ id: "a", speaker: "Ajumma Kwak", text: "Folded TWICE. I'm not saying it again." }],
    ajumma_b: [
      {
        id: "a",
        speaker: "Ajumma Bae",
        text: "Only one sock. He leaves one sock. Orange. Who wears orange socks in a crime?",
      },
      { id: "b", text: "Clue found: a single orange sock.", set: "clue_sock", meter: 1 },
    ],
    ajumma_b_again: [{ id: "a", speaker: "Ajumma Bae", text: "Orange. SOCK. Go." }],
    ajumma_c: [
      {
        id: "a",
        speaker: "Ajumma Choi",
        text: "You hear him laugh before you see him. Behind the flowers. A laugh like a wet balloon.",
      },
      { id: "b", text: "Clue found: the laugh behind the camellias.", set: "clue_laugh", meter: 1 },
    ],
    ajumma_c_again: [{ id: "a", speaker: "Ajumma Choi", text: "Wet balloon. Behind the flowers. Shoo." }],
    jester: [
      {
        id: "a",
        speaker: "???",
        text: "Hee hee hee. Three clues and a boy band. Did you come to laugh at me, Ongsang?",
      },
      {
        id: "b",
        speaker: "{m3}",
        text: "We came for the shard in your hat. And for everybody you scared.",
      },
      { id: "c", speaker: "The Jester", text: "Then let's see if your smiles survive the punchline." },
      {
        id: "d",
        text: "The Jester steps out from behind the camellias!",
        action: { kind: "battle", enemies: ["jester"], music: "boss", then: "jester_won" },
      },
    ],
    jester_won: [
      { id: "a", speaker: "The Jester", text: "No... the town is... laughing WITH you..." },
      {
        id: "b",
        speaker: "Officer Yong-sick",
        text: "{m3.nick|upper}-SSI! Now! Everything you want to say! SAY IT!",
      },
      {
        id: "c",
        speaker: "{m3}",
        text: "...{m1|upper} {m1.given|upper}, WHEREVER YOU ARE! YOU'RE OUR HEART! AND YOU SHOULD TELL HIM! WE ALL KNOW! {fandom} KNOWS!",
        action: {
          kind: "cutscene",
          trope: "declaration",
          title: "Trope: The Loud Public Declaration",
          caption: ["Ongsang gasps.", "The camellias bloom all at once.", "{m3.nick} learned DECLARE!"],
          still: "still_declaration",
          video: "declaration",
          then: "jester_done",
        },
      },
    ],
    jester_done: [
      { id: "a", text: "The Jester dissolves into confetti. Ongsang exhales.", set: "jester_done", meter: 3 },
    ],
    harbor_intro: [{ id: "a", text: "Salt air. A ferry pulling out. Someone small and orange on the deck." }],
    m1_ferry: [
      { id: "a", speaker: "{m6}", text: "{m1|upper}! {m1|upper}, IT'S US!" },
      {
        id: "b",
        text: "The ferry is already too far. The figure waves both arms, then holds up a note to the wind.",
      },
      { id: "c", text: "A quokka plush skitters down the gangway and drops a folded paper at your feet." },
      {
        id: "d",
        text: "'{m2.given}-hyung. If you find this first: I was going to say it. I'm still going to. -{m1.initial}' ... Quokka Note 1 collected.",
        set: "note_1",
        meter: 2,
      },
      {
        id: "e",
        speaker: "{m4}",
        text: "He's heading toward the island with the green tracksuits. That can't be good.",
      },
      {
        id: "f",
        speaker: "{m3}",
        text: "Then that's where we go next.",
        action: { kind: "chapter", chapter: "ch2" },
      },
    ],
  },
};
