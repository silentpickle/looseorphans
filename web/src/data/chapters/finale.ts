import type { Chapter, Enemy, Node } from "../types";

// The concert stage: a lit floor in the bottom three rows, the crowd's lightsticks beyond it. 20 x 11 cells of 32 px.
const STAGE_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "##.......G........##",
  "#..C............I..#",
  "#...X.Y.....Z.S....#",
];

const STAGE_SPAWN = { x: 9, y: 9 };
const RED_TRUE_FORM = 0xff7070;
const TRUE_FORM_SCALE = 1.6;

const ENEMIES: readonly Enemy[] = [
  {
    id: "contract",
    name: "Dating Ban Contract",
    stats: { hp: 200, mp: 0, atk: 15, def: 9, mag: 12, spd: 10 },
    stayPoints: 0,
    art: "boss_contract_boss",
    color: 0xe8dcc0,
    width: 96,
    height: 96,
    lines: ["reads Clause 4 at", "staples a footnote to"],
  },
  {
    id: "gwi_final",
    name: "Director Gwi",
    stats: { hp: 240, mp: 40, atk: 16, def: 10, mag: 14, spd: 13 },
    stayPoints: 0,
    art: "boss_gwi_demon_boss",
    color: 0x1a0b2e,
    width: 96,
    height: 96,
    lines: ["reads Clause 7 aloud at", "signs something in red near"],
  },
  {
    id: "gwi_true",
    name: "Gwi, True Form",
    stats: { hp: 260, mp: 60, atk: 18, def: 10, mag: 16, spd: 14 },
    stayPoints: 0,
    art: "boss_gwi_demon_boss",
    tint: RED_TRUE_FORM,
    artScale: TRUE_FORM_SCALE,
    color: 0x8a1010,
    width: 96,
    height: 96,
    lines: ["roars every hidden feeling at", "opens a mouth of fine print at"],
  },
];

/** The four members left on stage each have a last word; whoever Sol talks to first hands over Note 9. */
function memberTalk(line: string, speaker: string): readonly Node[] {
  return [{ id: "a", speaker, text: line }];
}

export const CHAPTER: Chapter = {
  id: "finale",
  title: "Finale: The {barrier} Concert",
  party: ["m1", "m2"],
  enemies: ENEMIES,
  start: { map: "stage", ...STAGE_SPAWN },
  maps: {
    stage: {
      id: "stage",
      name: "The {barrier} Concert",
      backdrop: "backdrop_finale_concert",
      battle: "concert_battle",
      music: "title",
      grid: STAGE_GRID,
      placeholder: 0x0b0b1a,
      onEnter: "finale_intro",
      npcs: [
        {
          id: "gwi",
          name: "Director Gwi",
          figure: "npc_gwi",
          glyph: "G",
          dialogue: "gwi",
          shownWhen: "party_picked",
          hiddenWhen: "finale_won",
          facing: "down",
        },
        {
          id: "m3",
          name: "{m3}",
          figure: "m3",
          glyph: "C",
          dialogue: "note_9_find",
          variants: [{ when: "note_9", dialogue: "member_m3" }],
          hiddenWhen: "pick_a",
        },
        {
          id: "m6",
          name: "{m6}",
          figure: "m6",
          glyph: "X",
          dialogue: "note_9_find",
          variants: [{ when: "note_9", dialogue: "member_m6" }],
          hiddenWhen: "pick_a",
        },
        {
          id: "m4",
          name: "{m4}",
          figure: "m4",
          glyph: "Y",
          dialogue: "note_9_find",
          variants: [{ when: "note_9", dialogue: "member_m4" }],
          hiddenWhen: "pick_b",
        },
        {
          id: "m5",
          name: "{m5}",
          figure: "m5",
          glyph: "Z",
          dialogue: "note_9_find",
          variants: [{ when: "note_9", dialogue: "member_m5" }],
          hiddenWhen: "pick_b",
        },
        {
          id: "m7",
          name: "{m7}",
          figure: "m7",
          glyph: "S",
          dialogue: "note_9_find",
          variants: [{ when: "note_9", dialogue: "member_m7" }],
          hiddenWhen: "pick_c",
        },
        {
          id: "m8",
          name: "{m8}",
          figure: "m8",
          glyph: "I",
          dialogue: "note_9_find",
          variants: [{ when: "note_9", dialogue: "member_m8" }],
          hiddenWhen: "pick_c",
        },
      ],
      warps: [],
    },
  },
  dialogues: {
    finale_intro: [
      {
        id: "a",
        text: "The seventh shard clicks into the lightstick. Light pours out of it like a song finding its key.",
      },
      {
        id: "b",
        text: "One by one, the Dramaverse lets them go. A seaside town. A playground. A palace. A studio. A bog. A tavern. A stage.",
      },
      {
        id: "c",
        speaker: "{m3}",
        text: "Everyone okay? Head count. ...Eight. EIGHT! Group hug. Now. That's an order from your leader.",
      },
      {
        id: "d",
        speaker: "{m6}",
        text: "I brought brownies. I carried them through seven worlds. They're a bit squashed. They're still brownies.",
      },
      { id: "e", speaker: "{m1}", text: "Hyung. I wrote you seven notes." },
      { id: "f", speaker: "{m2}", text: "I know. I read them all. In order. Twice." },
      {
        id: "g",
        speaker: "{m1}",
        text: "...You did?",
        choices: [
          { text: "{m1}: 'Then you know what I was going to say.'", next: "h1", meter: 2 },
          { text: "{m1}: 'Even the one with the drawing of a cat?'", next: "h2", meter: 1 },
        ],
      },
      {
        id: "h1",
        speaker: "{m2}",
        text: "I know what you were going to say. Say it anyway. Later. When nobody's holding a contract.",
        next: "i",
      },
      {
        id: "h2",
        speaker: "{m2}",
        text: "Especially the cat. It was anatomically insulting. I kept it.",
        next: "i",
      },
      {
        id: "i",
        text: "{m2} presses a folded note into {m1}'s hand. His handwriting. 'Took you long enough. -{m2.initial}' ... Quokka Note 8 collected.",
        set: "note_8",
        meter: 2,
      },
      {
        id: "j",
        text: "The stage lights snap to red. A voice from every speaker, reading carefully: 'Clause 7. Final paragraph.'",
      },
      {
        id: "k",
        speaker: "Director Gwi",
        text: "Idols shall not. Shall not WHAT, Mr. {m1}? You never finished. I'll wait. I'm very patient. I'm a contract.",
      },
      {
        id: "l",
        speaker: "{m3}",
        text: "Two of us go up with {m1.given} and {m2.given}. The rest of us hold the {barrier}. Who's going?",
        choices: [
          { text: "{m3} and {m6}: {aussie}.", next: "pa", set: "pick_a" },
          { text: "{m4} and {m5}: beautiful, and very loud.", next: "pb", set: "pick_b" },
          { text: "{m7} and {m8}: the fine print and the maknae.", next: "pc", set: "pick_c" },
        ],
      },
      {
        id: "pa",
        speaker: "{m6}",
        text: "Good morning, Director. It's night. I don't care. Let's go.",
        set: "party_picked",
        action: { kind: "party", members: ["m1", "m2", "m3", "m6"] },
      },
      {
        id: "pb",
        speaker: "{m4}",
        text: "{m5} and I will make this beautiful. And loud. Mostly loud.",
        set: "party_picked",
        action: { kind: "party", members: ["m1", "m2", "m4", "m5"] },
      },
      {
        id: "pc",
        speaker: "{m7}",
        text: "{m8} and I read the whole contract. It has a typo. We're going to exploit it.",
        set: "party_picked",
        action: { kind: "party", members: ["m1", "m2", "m7", "m8"] },
      },
    ],
    note_9_find: [
      {
        id: "a",
        text: "During the group hug, someone slipped a folded paper into {m1}'s pocket. It's {m2}'s handwriting again.",
      },
      {
        id: "b",
        text: "'I kept every note. All seven. They're in the cat food tin. Don't tell anyone. -{m2.initial}' ... Quokka Note 9 collected.",
        set: "note_9",
        meter: 2,
      },
    ],
    member_m3: memberTalk("You okay? ...Yeah. Me too. Go win this. We've got the {barrier}.", "{m3}"),
    member_m6: memberTalk("Good morning! It's night. I don't care. Brownie for the road?", "{m6}"),
    member_m4: memberTalk(
      "Look at this lighting. Someone in this concert is about to confess. I can feel it.",
      "{m4}",
    ),
    member_m5: memberTalk("Don't think. Lift. And by lift I mean the whole Dramaverse.", "{m5}"),
    member_m7: memberTalk("I read Clause 7. There's a typo. I'm telling everyone. Loudly.", "{m7}"),
    member_m8: memberTalk("If anything goes wrong, I'm the maknae. Legally not my fault.", "{m8}"),
    gwi: [
      {
        id: "a",
        speaker: "Director Gwi",
        text: "Seven shards and one very loud boy. Charming. Clause 1: the house always wins.",
      },
      { id: "b", speaker: "{m1}", text: "We're not playing your game. We're playing ours." },
      { id: "c", speaker: "{m2}", text: "{m1.given}. That was cheesy." },
      { id: "d", speaker: "{m1}", text: "It was GOOD." },
      {
        id: "e",
        text: "The Dating Ban Contract unrolls itself across the stage like a red carpet nobody asked for.",
        action: { kind: "battle", enemies: ["contract"], music: "final_boss_1", then: "phase1_won" },
      },
    ],
    phase1_won: [
      { id: "a", text: "The Contract tears down the middle. Paper confetti snows over the crowd." },
      {
        id: "b",
        speaker: "Director Gwi",
        text: "Clause 2: if the contract fails, the Director enforces it personally.",
        action: { kind: "battle", enemies: ["gwi_final"], music: "final_boss_2", then: "phase2_won" },
      },
    ],
    phase2_won: [
      {
        id: "a",
        speaker: "Director Gwi",
        text: "You think a suit is all I am? Clause 3: the Director has no feelings. Only appetite.",
      },
      {
        id: "b",
        text: "The suit splits. Something enormous and red unfolds out of it, made of every feeling anyone was told to hide.",
      },
      {
        id: "c",
        text: "Out in the dark, eight hundred thousand lightsticks flicker, and hold.",
        action: { kind: "battle", enemies: ["gwi_true"], music: "final_boss_3", then: "phase3_won" },
      },
    ],
    phase3_won: [
      {
        id: "a",
        speaker: "Director Gwi",
        text: "Hidden feelings taste best. Hide it, Mr. {m1}. Hide it like you always do.",
      },
      { id: "b", speaker: "{m1}", text: "No." },
      { id: "c", speaker: "{m1}", text: "I'm done hiding it. {m2.given}-hyung..." },
      {
        id: "d",
        speaker: "{m2}",
        text: "Together. On three. Like the duet. Like the bridge. Like all of it.",
      },
      {
        id: "e",
        text: "One. Two.",
        action: {
          kind: "cutscene",
          trope: "unison",
          title: "{unison}",
          caption: [
            "{m1} and {m2} share one microphone.",
            "Six voices behind them. Eight hundred thousand lights in front.",
            "The {barrier} comes back together, louder than before.",
          ],
          still: "backdrop_finale_concert",
          video: "finale_concert",
          then: "unison_done",
        },
      },
    ],
    unison_done: [
      {
        id: "a",
        text: "Director Gwi comes apart into a shower of unsigned paper. The Dating Ban Contract is just paper now.",
        set: "finale_won",
        meter: 3,
      },
      {
        id: "b",
        text: "The concert ends. The Dramaverse folds itself away. Home: the dorm rooftop, the night after the comeback. It's raining.",
        ending: { A: "end_a", B: "end_b" },
      },
      {
        id: "end_a",
        text: "{m1} waits under the rooftop's one umbrella. {m2} walks out into the rain and stands under it with him.",
        action: {
          kind: "cutscene",
          trope: "confession",
          title: "Ending: The Confession",
          caption: [
            "The rooftop. The rain. One umbrella.",
            "{m1} finally finishes the sentence.",
            "{m2}: 'I know. Me too. Took you long enough.'",
          ],
          still: "still_confession",
          video: "confession",
          then: "epilogue_a",
        },
      },
      {
        id: "end_b",
        text: "{m1} turns to {m2}. Opens his mouth. The rain picks up.",
        action: {
          kind: "cutscene",
          trope: "moon_pan",
          title: "Ending: The Moon Pan",
          caption: [
            "{m1} opens his mouth to say it.",
            "The camera, very dramatically, pans up to the moon.",
            "Somewhere below, someone is definitely holding hands.",
          ],
          still: "still_moon_pan",
          video: "moon_pan",
          then: "epilogue_b",
        },
      },
    ],
    epilogue_a: [
      {
        id: "a",
        speaker: "{m3}",
        text: "Are you two coming in or... oh. OH. Okay! Okay. I'm taking the cats for a walk. All of them.",
      },
      { id: "b", speaker: "{m2}", text: "We don't walk the cats." },
      { id: "c", speaker: "{m1}", text: "Hyung. Thank you for carrying me. Across all of it." },
      { id: "d", speaker: "{m2}", text: "...Anytime, {m1.given}.", action: { kind: "credits" } },
    ],
    epilogue_b: [
      {
        id: "a",
        speaker: "{m4}",
        text: "You saw that, right? You saw it. He definitely said it. {fandom} knows.",
      },
      { id: "b", speaker: "{m7}", text: "{m4}. Who are you talking to?" },
      { id: "c", speaker: "{m4}", text: "The audience.", action: { kind: "credits" } },
    ],
  },
};
