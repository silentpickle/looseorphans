import type { Action, Chapter } from "../types";
import type { TimingSpec } from "../../minigames/types";

// The bog: trees and sky along the top, Hosier's cottage top right, a black pool on the left and another on the
// right, and one muddy path that runs from the cottage down to a dead end in the bottom-left corner.
// 20 columns by 11 rows of 32px over the 640x360 screen (overlay: reports/grids/bog.png).
const BOG_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "###########..#..#D##",
  "######...##..#..H.##",
  "########..........##",
  "########M........###",
  "#######.....########",
  "#######.....########",
  "#T..........########",
  "#....###############",
];

// The Unreal Unearth: a stone hall with a dark arch going down. Floor along the bottom, the arch in the middle.
// (overlay: reports/grids/unearth_circle.png)
const CIRCLE_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "##########.X.#######",
  "##########...#######",
  "##########...#######",
  "##########...#######",
  "######L.....F..#####",
  "#####....G......####",
  "#####v.........P####",
];

const BOG_SPAWN = { x: 9, y: 7 };
const DOOR_STEP = { x: 17, y: 4 };
const CIRCLE_SPAWN = { x: 10, y: 10 };

const SMALL = 64;
const LARGE = 128;

// Lio's low note against Hosier's: tuned in docs/minigames.md.
const BASS_OFF: TimingSpec = {
  kind: "timing",
  id: "bassoff",
  title: "Bass-off: {m6} vs Hosier",
  prompt: "Drop the note when the marker hits the middle",
  rounds: 4,
  lives: 3,
  sweepsPerSecond: 1.4,
  window: 0.22,
  invert: false,
};

const START_BASS_OFF: Action = {
  kind: "minigame",
  spec: BASS_OFF,
  onWin: "bassoff_won",
  onLose: "bassoff_lost",
};

export const CHAPTER: Chapter = {
  id: "ch5",
  title: "Chapter 5: The Bog of Hosier",
  party: ["m1", "m5", "m6"],
  start: { map: "bog", ...BOG_SPAWN },
  speakers: { "{m2} (reflection)": "m2" },
  items: [
    {
      id: "black_coffee",
      name: "Hosier's Black Coffee",
      heal: 35,
      line: "drinks it black, makes a face, feels better",
    },
  ],
  enemies: [
    {
      id: "bog_wisp",
      name: "Bog Wisp",
      art: "enemy_bog_wisp",
      stats: { hp: 38, mp: 0, atk: 12, def: 5, mag: 9, spd: 13 },
      stayPoints: 24,
      color: 0x6fae8a,
      width: SMALL,
      height: SMALL,
      lines: ["flickers just out of reach", "hums a note too low to hear"],
    },
    {
      id: "banquet_ghoul",
      name: "The Banquet Ghoul",
      art: "boss_ghoul_boss",
      stats: { hp: 190, mp: 24, atk: 14, def: 8, mag: 11, spd: 10 },
      stayPoints: 160,
      color: 0x5a2a3a,
      width: LARGE,
      height: LARGE,
      lines: ["serves tomorrow on a silver plate", "asks if you'll finish that", "rings for dessert"],
    },
  ],
  maps: {
    bog: {
      id: "bog",
      name: "The Bog of Hosier",
      backdrop: "backdrop_bog",
      battle: "bog_battle",
      music: "bog",
      placeholder: 0x3b4a2e,
      grid: BOG_GRID,
      onEnter: "bog_intro",
      encounters: { rate: 0.03, groups: [["bog_wisp"], ["bog_wisp", "bog_wisp"]] },
      npcs: [
        {
          id: "hosier",
          name: "Hosier",
          figure: "npc_hosier",
          glyph: "H",
          dialogue: "hosier",
          variants: [
            { when: "ghoul_done", dialogue: "hosier_after" },
            { when: "bassoff_won", dialogue: "hosier_door" },
            { when: "met_hosier", dialogue: "hosier_rematch" },
          ],
        },
        {
          id: "moira",
          name: "Moira of the Moss",
          figure: "npc_bogwoman",
          glyph: "M",
          dialogue: "moira",
          facing: "left",
          variants: [
            { when: "umbrella_done", dialogue: "moira_end" },
            { when: "ghoul_done", dialogue: "moira_rain" },
          ],
        },
        {
          id: "turfcutter",
          name: "Turf-Cutter Seamus-ish",
          figure: "npc_turfcutter",
          glyph: "T",
          dialogue: "turfcutter",
          facing: "right",
          variants: [{ when: "note_5", dialogue: "turfcutter_again" }],
        },
      ],
      warps: [{ glyph: "D", map: "unearth", requires: "bassoff_won", ...CIRCLE_SPAWN }],
    },
    unearth: {
      id: "unearth",
      name: "Unreal Unearth",
      backdrop: "backdrop_unearth_circle",
      battle: "bog_battle",
      music: "bog",
      placeholder: 0x2a1f33,
      grid: CIRCLE_GRID,
      onEnter: "unearth_intro",
      npcs: [
        {
          id: "hosier_guide",
          name: "Hosier",
          figure: "npc_hosier",
          glyph: "G",
          dialogue: "hosier_guide",
          facing: "right",
          variants: [{ when: "ghoul_done", dialogue: "hosier_circles" }],
        },
        {
          id: "limbo",
          name: "The Waiting Man",
          figure: "npc_soul_limbo",
          glyph: "L",
          dialogue: "limbo",
          variants: [{ when: "circle_1", dialogue: "limbo_again" }],
        },
        {
          id: "francesca",
          name: "Francesca-ish",
          figure: "npc_soul_f",
          glyph: "F",
          dialogue: "lovers",
          facing: "right",
          variants: [{ when: "circle_2", dialogue: "lovers_again" }],
        },
        {
          id: "paolo",
          name: "Paolo-ish",
          figure: "npc_soul_m",
          glyph: "P",
          dialogue: "paolo",
          facing: "up",
          variants: [{ when: "circle_2", dialogue: "paolo_again" }],
        },
        {
          id: "ghoul",
          name: "The Banquet Ghoul",
          figure: "npc_ghoul",
          glyph: "X",
          dialogue: "ghoul",
          shownWhen: "circle_2",
          hiddenWhen: "ghoul_done",
        },
      ],
      warps: [{ glyph: "v", map: "bog", ...DOOR_STEP }],
    },
  },
  dialogues: {
    bog_intro: [
      { id: "a", text: "Mist. Moss. Trees older than the idea of trees. Somewhere, a kettle is whistling." },
      {
        id: "b",
        speaker: "{m1}",
        text: "Okay. Okay okay okay. A swamp. Is this a swamp? {m2.given}-hyung would hate this. He'd hate the mud. I'm fine!",
      },
      { id: "c", speaker: "{m5}", text: "It's a bog. Bogs are just swamps that do leg day. Breathe." },
      {
        id: "d",
        speaker: "{m6}",
        text: "Good morning, bog! I found an oven inside a tree stump, so if anyone needs a brownie, it's handled.",
      },
      {
        id: "e",
        text: "(A cottage with a crooked chimney. Smoke. Someone very tall is hanging socks on a line.)",
      },
    ],
    hosier: [
      {
        id: "a",
        speaker: "Hosier",
        text: "Oh, hello. Travellers. Mind the soft ground; it keeps what it's given. Socks? Hand-knit. Wool from the hill.",
      },
      { id: "b", speaker: "{m5}", text: "You're... really tall. Respectfully. What's your deadlift?" },
      {
        id: "c",
        speaker: "Hosier",
        text: "I've never tried. I mostly lift kettles. Coffee? I call this pot 'Too Sweet', as a joke. It isn't.",
      },
      { id: "d", speaker: "{m1}", text: "Do you have sugar? Any sugar? A sugar-adjacent product?" },
      {
        id: "e",
        speaker: "Hosier",
        text: "There's no sugar in the bog. Everything here is a little bitter, and the better for it.",
      },
      {
        id: "f",
        speaker: "{m1}",
        text: "That's the saddest thing anyone has ever said to me. I'll take two.",
      },
      {
        id: "g",
        speaker: "Hosier",
        text: "You're after the shard. It went down, under the cottage, into the Unreal Unearth. Nine circles. One's hungry.",
      },
      {
        id: "h",
        speaker: "Hosier",
        text: "The door only opens for a low enough note, and my voice has gone soft with the damp. Can any of you go deep?",
      },
      { id: "i", speaker: "{m6}", text: "...Good morning.", set: "met_hosier" },
      { id: "j", text: "Three herons take off at once. A frog applauds." },
      {
        id: "k",
        speaker: "Hosier",
        text: "Oh, that's lovely. Then let's sing the door open, you and I. A friendly bass-off.",
        action: START_BASS_OFF,
      },
    ],
    hosier_rematch: [
      { id: "a", speaker: "Hosier", text: "Ready to go low again? The door's patient. So am I." },
      { id: "b", speaker: "{m6}", text: "Ready. I had a brownie. That's lower-register fuel." },
      { id: "c", text: "{m6} and Hosier square up across the moss.", action: START_BASS_OFF },
    ],
    bassoff_lost: [
      { id: "a", speaker: "Hosier", text: "Close. The bog felt it. The door only rattled." },
      { id: "b", speaker: "{m5}", text: "Shake it off, {m6.nick}. Reps. That was just a warm-up set." },
      {
        id: "c",
        speaker: "{m6}",
        text: "One more?",
        choices: [
          { text: "Again. From the chest.", next: "d" },
          { text: "Catch our breath first.", next: "e" },
        ],
      },
      { id: "d", text: "{m6} rolls his shoulders. Hosier hums a starting note.", action: START_BASS_OFF },
      {
        id: "e",
        speaker: "Hosier",
        text: "Take your time. Come back when the note's ready. I'll be here. I'm always here.",
      },
    ],
    bassoff_won: [
      { id: "a", text: "{m6} lands the last note so low the pools ripple outward. The moss hums along." },
      {
        id: "b",
        speaker: "Hosier",
        text: "Well. That's the lowest note this bog has heard since the glaciers left. Thank you.",
      },
      {
        id: "c",
        speaker: "{m6}",
        text: "Thank YOU. You were amazing. Can I hug you? I'm going to hug you.",
      },
      {
        id: "d",
        text: "The cottage door creaks open. Where the floor should be, there are stairs going down.",
        set: "bassoff_won",
        meter: 1,
      },
      { id: "e", speaker: "Hosier", text: "I'll walk you down. Mind the circles. Mind each other more." },
    ],
    hosier_door: [
      {
        id: "a",
        speaker: "Hosier",
        text: "The door's open. I'll meet you at the bottom of the stairs. I know a shortcut.",
      },
      { id: "b", speaker: "{m5}", text: "Shortcut through a hell dimension. Love that for us." },
      {
        id: "c",
        speaker: "Hosier",
        text: "And take a pair of socks. These are the Cherry Wine ones. The deep red. Wet feet make you sad.",
      },
    ],
    hosier_after: [
      { id: "a", speaker: "Hosier", text: "You came back up. Most don't hurry. Moira's by the black pool." },
      {
        id: "b",
        speaker: "Hosier",
        text: "Here. For the road. Black. I'm sorry. I did look for sugar.",
        action: { kind: "give", item: "black_coffee", count: 2 },
      },
    ],
    moira: [
      {
        id: "a",
        speaker: "Moira of the Moss",
        text: "Don't lean over the black pool, love. Not unless you're ready.",
      },
      { id: "b", speaker: "{m1}", text: "Ready for what?" },
      {
        id: "c",
        speaker: "Moira of the Moss",
        text: "It shows you who you're missing. The bog's honest like that. Rude, but honest.",
      },
    ],
    moira_rain: [
      { id: "a", text: "Rain arrives over the bog, soft and sideways, the way it does here." },
      {
        id: "b",
        speaker: "Moira of the Moss",
        text: "There it is. Here, take the umbrella. I've only ever had the one. Seems that's all anyone needs.",
      },
      { id: "c", speaker: "{m5}", text: "{m6}. We should go look at that tree. Over there. Far away." },
      { id: "d", speaker: "{m6}", text: "Love that tree. Big fan of that tree." },
      {
        id: "e",
        text: "{m1} stands alone at the edge of the black pool, holding one umbrella over the water.",
      },
      {
        id: "f",
        text: "In the water: {m1}. And next to {m1}, holding the other side of the handle, {m2}.",
      },
      { id: "g", text: "{m1} looks up. Nobody there. Rain on his left shoulder. He looks down again." },
      { id: "h", speaker: "{m2} (reflection)", text: "...You're getting wet." },
      {
        id: "i",
        speaker: "{m1}",
        text: "{m2.given}-hyung...",
        action: {
          kind: "cutscene",
          trope: "shared_umbrella",
          title: "Trope: The Shared Umbrella",
          caption: [
            "In the reflection, he tilts the umbrella toward {m1}.",
            "Only one of them is really there.",
            "The rain stops on both sides anyway.",
          ],
          still: "still_shared_umbrella",
          video: "shared_umbrella",
          then: "umbrella_done",
        },
      },
    ],
    umbrella_done: [
      {
        id: "a",
        text: "The water goes still. Just {m1} now. The rain isn't falling on him anymore.",
        set: "umbrella_done",
        meter: 3,
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "He tilted it toward me. He always does that. He gets the wet shoulder and says nothing.",
      },
      { id: "c", speaker: "{m6}", text: "{m1}. Everybody knows. {fandom} knows." },
      { id: "d", speaker: "{m5}", text: "So next time you see him for real, don't think. Lift. Say it." },
      { id: "e", speaker: "{m1}", text: "...Okay. Next time. For real." },
      {
        id: "f",
        speaker: "Moira of the Moss",
        text: "Keep the umbrella. Bog's done with you, in the good way. Mind how you go.",
        action: { kind: "chapter", chapter: "ch6" },
      },
    ],
    moira_end: [
      { id: "a", speaker: "Moira of the Moss", text: "Still here? Go on. Someone's holding the other side." },
    ],
    turfcutter: [
      { id: "a", text: "A man is cutting turf, humming a work song. No words. Just the shape of one." },
      {
        id: "b",
        speaker: "Turf-Cutter Seamus-ish",
        text: "Two hundred years of peat in this bank, and the newest thing in it is this. Blank paper. Dry, somehow. It wants writing on.",
      },
      {
        id: "c",
        text: "'{m2.given}-hyung. There's a pool here that shows you who you miss. I didn't look. I already know. -{m1.initial}' ... Quokka Note 5 written.",
        set: "note_5",
        meter: 2,
      },
      {
        id: "d",
        speaker: "{m1}",
        text: "Quokka. Cheek storage. Take it to him. Don't read it. ...You can't read. Okay. Go.",
      },
      {
        id: "e",
        text: "{m1.pet} tucks the note in its cheek, dives into the moss, and pops back out with empty cheeks.",
      },
    ],
    turfcutter_again: [
      {
        id: "a",
        speaker: "Turf-Cutter Seamus-ish",
        text: "Back to the work. The song keeps the spade honest.",
      },
    ],
    unearth_intro: [
      {
        id: "a",
        text: "Stone. Mushrooms that glow like they know something. Far above, a purple sky turns slowly.",
      },
      {
        id: "b",
        speaker: "Hosier",
        text: "The Unreal Unearth. Nine circles, stacked like plates. They've folded into one hall for us. Polite of them.",
      },
      {
        id: "c",
        speaker: "{m1}",
        text: "Nine. Circles. Of HELL? We're doing a whole Dante? I didn't stretch!",
      },
      {
        id: "d",
        speaker: "Hosier",
        text: "Only the first three are awake tonight. Talk to who's waiting. Each one is a circle. I'll name them as we pass.",
      },
    ],
    hosier_guide: [
      {
        id: "a",
        speaker: "Hosier",
        text: "The first circle is Limbo, by the left wall. Nobody's punished there. They're only waiting.",
      },
      {
        id: "b",
        speaker: "Hosier",
        text: "The second is the whirlwind, by the right. Lovers, blown about. Go gently with them. And with yourself.",
      },
      { id: "c", speaker: "Hosier", text: "The third is down the arch. A banquet. Don't sit at the table." },
    ],
    hosier_circles: [
      {
        id: "a",
        speaker: "Hosier",
        text: "You've crossed three. Shall I name the rest as we climb? It's quicker than walking them.",
      },
      {
        id: "b",
        speaker: "Hosier",
        text: "Four, the hoarders. Five, the angry, in the mud. Six, the ones who were sure. Seven, the ones who lashed out.",
      },
      {
        id: "c",
        speaker: "Hosier",
        text: "Eight, the liars, which is very crowded. Nine is ice. I never go in winter.",
      },
      { id: "d", speaker: "{m5}", text: "That's a full split. Glad we skipped legs." },
      {
        id: "e",
        speaker: "Hosier",
        text: "Go on up. It'll be raining. It always rains after. Moira will be at the black pool.",
      },
    ],
    limbo: [
      {
        id: "a",
        speaker: "The Waiting Man",
        text: "Circle one. Limbo. Nothing bad happens here. Nothing at all happens here.",
      },
      {
        id: "b",
        speaker: "The Waiting Man",
        text: "I meant to say something, once. I thought I had time. So now I have time.",
      },
      { id: "c", speaker: "{m1}", text: "...That's a lot of time.", set: "circle_1" },
      { id: "d", speaker: "Hosier", text: "Circle one. Passed. Keep moving. It's the moving that matters." },
    ],
    limbo_again: [{ id: "a", speaker: "The Waiting Man", text: "Still waiting. Don't you." }],
    lovers: [
      {
        id: "a",
        text: "Circle two. Wind howls in a hall with no windows. Two souls turn in it, never quite touching.",
      },
      {
        id: "b",
        speaker: "Francesca-ish",
        text: "We were reading a book together. One chapter. We never finished it. He was right there.",
      },
      {
        id: "c",
        speaker: "Francesca-ish",
        text: "I meant to tell him. Then the wind. Then always the wind.",
      },
      { id: "d", text: "{m1} stops walking." },
      {
        id: "e",
        speaker: "{m1}",
        text: "That's us. That's exactly us. I keep ALMOST saying it, and then a ferry leaves, or a floor opens, or a demon shows up.",
      },
      {
        id: "f",
        speaker: "{m1}",
        text: "What if that's it? What if we just get blown past each other forever, and I never say it, and he never knows?",
      },
      { id: "g", text: "Nobody says anything for a moment. Even the wind." },
      {
        id: "h",
        speaker: "{m5}",
        text: "Hey. Look at me.",
        choices: [
          { text: '"Then we\'ll just have to out-lift the wind."', next: "i", meter: 1 },
          { text: "\"You'll say it. And we'll be standing right there.\"", next: "j", meter: 2 },
        ],
      },
      {
        id: "i",
        speaker: "{m5}",
        text: "Wind's just air doing cardio. You're stronger than cardio.",
        next: "k",
      },
      { id: "j", speaker: "{m6}", text: "Right there. Both of us. With brownies." },
      { id: "k", speaker: "{m1}", text: "...Okay. Okay. Sorry. I'm fine. I'm actually, a little bit, fine." },
      {
        id: "l",
        speaker: "Francesca-ish",
        text: "Say it while there's still floor under you. That's all we'd tell you, if the wind let us.",
        set: "circle_2",
      },
      { id: "m", text: "Down the arch, a table sets itself. Cutlery scrapes. Something is hungry." },
    ],
    lovers_again: [
      {
        id: "a",
        speaker: "Francesca-ish",
        text: "Go. While there's floor. We'll be fine. We have the wind.",
      },
    ],
    paolo: [
      { id: "a", text: "He opens his mouth to speak. The wind takes the words before they're made." },
      {
        id: "b",
        text: "He points at Francesca-ish. Then at {m1}. Then at his own mouth. Then he just looks sad.",
      },
    ],
    paolo_again: [{ id: "a", text: "He gives {m1} a thumbs-up. The wind takes that too, but {m1} saw it." }],
    ghoul: [
      {
        id: "a",
        speaker: "The Banquet Ghoul",
        text: "Guests! Sit, sit. Tonight's menu: everything you were saving for later. Why wait? Eat it now.",
      },
      {
        id: "b",
        speaker: "Hosier",
        text: "That's the one who'd eat your young, if you let him. Every tomorrow, served tonight. The shard's his centrepiece.",
      },
      { id: "c", speaker: "{m5}", text: "Nobody eats my tomorrow. I meal-prep my tomorrow." },
      {
        id: "d",
        speaker: "{m6}",
        text: "And there's no dessert on your table. That's a crime. I'm reporting you.",
      },
      {
        id: "e",
        text: "The Banquet Ghoul pushes back his chair!",
        action: { kind: "battle", enemies: ["banquet_ghoul"], music: "boss", then: "ghoul_won" },
      },
    ],
    ghoul_won: [
      { id: "a", speaker: "The Banquet Ghoul", text: "But... the courses... I was saving room..." },
      {
        id: "b",
        text: "The table folds into the floor. The candles go out one by one. Something glows on the empty plate.",
      },
      { id: "c", text: "Got the fifth Lightstick Shard!", set: "shard_5" },
      {
        id: "d",
        speaker: "{m6}",
        text: "Five down. Two to go. And I'm leaving a brownie on the plate. Everyone deserves dessert.",
      },
      { id: "e", text: "Circle three is quiet now.", set: "ghoul_done", meter: 2 },
    ],
  },
};
