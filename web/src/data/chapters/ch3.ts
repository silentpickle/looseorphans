import type { TimingSpec } from "../../minigames/types";
import type { Chapter } from "../types";

// The palace courtyard: the hall's roof and veranda along the top with its stairs at columns 8-10, a cherry tree
// top right, stone lanterns in the corners, paving everywhere else. 20 columns by 11 rows of 32px over 640x360.
const PALACE_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "########.^.#########",
  ".......O.....G...###",
  "..................E.",
  "............S.......",
  ".I..C...............",
  "#..................#",
  "#..................#",
  "#..................#",
];

// The great hall: windows and pillars along the top, the throne at columns 8-10, two long low tables in front of
// it, lanterns on stands at both sides, pots in the bottom corners. The door out is at the bottom.
const HALL_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "###########....#####",
  "##############.#####",
  "###.##########...###",
  "###..............###",
  "###......Y.......###",
  "#...L............###",
  "##.......v........##",
];

const PALACE_SPAWN = { x: 9, y: 7 };
const FROM_HALL = { x: 9, y: 5 };
const HALL_SPAWN = { x: 9, y: 9 };
const RESCUED = { x: 11, y: 7 };

// The tuned tea-pouring skin (docs/minigames.md): a miss spills on the Queen Mother.
const TEA_POUR: TimingSpec = {
  kind: "timing",
  id: "tea",
  title: "Tea for the Queen Mother",
  prompt: "Pour when the cup is exactly full",
  rounds: 3,
  lives: 2,
  sweepsPerSecond: 1,
  window: 0.18,
  invert: false,
};

export const CHAPTER: Chapter = {
  id: "ch3",
  title: "Chapter 3: Scarlet Heart Ryeo",
  party: ["m1", "m4", "m7", "m8"],
  start: { map: "palace", ...PALACE_SPAWN },
  costumes: {
    m1: "ch3_m1_hanbok",
    m4: "ch3_m4_prince",
    m7: "ch3_m7_prince",
    m8: "ch3_m8_prince",
    m2: "ch3_sooo",
  },
  speakers: { "Queen Mother Yoo-hoo": "yoohoo" },
  enemies: [
    {
      id: "palace_guard",
      name: "Palace Guard",
      art: "enemy_palace_guard",
      stats: { hp: 40, mp: 0, atk: 12, def: 5, mag: 3, spd: 10 },
      stayPoints: 20,
      color: 0x8a2a2a,
      width: 64,
      height: 64,
      lines: ["asks for your hall pass", "blocks the gate with a very long spear"],
    },
    {
      id: "yoohoo",
      name: "Queen Mother Yoo-hoo",
      art: "boss_yoohoo_boss",
      stats: { hp: 200, mp: 30, atk: 13, def: 8, mag: 12, spd: 11 },
      stayPoints: 160,
      color: 0x5a1f6e,
      width: 96,
      height: 96,
      lines: ["issues a decree against joy", "smiles at you. It's worse.", "pours poisoned flattery"],
    },
  ],
  maps: {
    palace: {
      id: "palace",
      name: "Goryeo Palace, the Inner Court",
      backdrop: "backdrop_goryeo_palace",
      battle: "goryeo_battle",
      music: "goryeo",
      placeholder: 0x8a8a8a,
      grid: PALACE_GRID,
      onEnter: "palace_intro",
      encounters: { rate: 0.03, groups: [["palace_guard"], ["palace_guard", "palace_guard"]] },
      npcs: [
        {
          id: "ohmy",
          name: "Court Lady Oh-my",
          figure: "ch3_head_lady",
          glyph: "O",
          dialogue: "ohmy",
          variants: [{ when: "etiquette_done", dialogue: "ohmy_after" }],
        },
        // Listed before Chae: the overworld talks to the first NPC in range, and Nico stands beside her.
        {
          id: "m8_stays",
          name: "{m8}",
          figure: "ch3_m8_prince",
          glyph: "I",
          dialogue: "m8_stays",
          shownWhen: "sooo_joined",
          facing: "right",
        },
        {
          id: "chae",
          name: "Court Lady Chae",
          figure: "ch3_court_lady",
          glyph: "C",
          dialogue: "chae",
          variants: [{ when: "sooo_rescue", dialogue: "chae_after" }],
        },
        {
          id: "guard",
          name: "Palace Guard",
          figure: "ch3_palace_guard",
          glyph: "G",
          dialogue: "guard",
          variants: [{ when: "etiquette_done", dialogue: "guard_after" }],
        },
        {
          id: "servant",
          name: "Little Eunuch Bok",
          figure: "ch3_servant",
          glyph: "E",
          dialogue: "servant",
          variants: [{ when: "note_3", dialogue: "servant_after" }],
        },
        {
          id: "sooo",
          name: "Wang Sooo",
          figure: "ch3_sooo",
          glyph: "S",
          dialogue: "sooo",
          shownWhen: "sooo_rescue",
          hiddenWhen: "sooo_joined",
        },
      ],
      warps: [{ glyph: "^", map: "hall", requires: "etiquette_done", ...HALL_SPAWN }],
    },
    hall: {
      id: "hall",
      name: "The Great Hall",
      backdrop: "backdrop_goryeo_hall",
      battle: "goryeo_battle",
      music: "goryeo",
      placeholder: 0x6a3a1a,
      grid: HALL_GRID,
      onEnter: "hall_intro",
      npcs: [
        {
          id: "yoohoo",
          name: "Queen Mother Yoo-hoo",
          figure: "ch3_queen_mother",
          glyph: "Y",
          dialogue: "yoohoo_tea",
          variants: [
            { when: "sooo_joined", dialogue: "yoohoo_boss" },
            { when: "sooo_rescue", dialogue: "yoohoo_waiting" },
            { when: "minigame:tea:lost", dialogue: "yoohoo_tea_again" },
          ],
        },
        {
          id: "tea_lady",
          name: "Court Lady Min",
          figure: "ch3_court_lady",
          glyph: "L",
          dialogue: "tea_lady",
          facing: "right",
        },
      ],
      warps: [{ glyph: "v", map: "palace", ...FROM_HALL }],
    },
  },
  dialogues: {
    palace_intro: [
      {
        id: "a",
        text: "A flash. A gong. Cherry blossoms. Somewhere, a thousand years ago, a boy lands face first.",
      },
      { id: "b", speaker: "{m1}", text: "Ow. OW. Okay. Where... Why am I wearing a SKIRT? Is this a skirt?" },
      {
        id: "c",
        speaker: "{m4}",
        text: "It's a chima. Red silk, orange jeogori. {m1}, the light on you right now. Honestly? Stunning.",
      },
      {
        id: "d",
        speaker: "{m7}",
        text: "We woke up as princes. You woke up as a court lady. The palace has opinions.",
      },
      {
        id: "e",
        speaker: "{m8}",
        text: "I'm the 14th prince. I checked. Legally, nobody can make me carry anything.",
      },
      {
        id: "f",
        speaker: "{m1}",
        text: "I'm fine! Totally fine! Has anyone seen {m2.given}-hyung? He'd laugh at this. Then he'd... also laugh.",
      },
      {
        id: "g",
        text: "(The head court lady is staring at you. Court ladies are not supposed to sit on the floor.)",
      },
    ],
    ohmy: [
      {
        id: "a",
        speaker: "Court Lady Oh-my",
        text: "You. New girl. You fell out of the sky and you're on my paving. Name?",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "{m1}! {m1}... -ah. {m1}-ah. Court Lady {m1}-ah. Reporting for... court.",
      },
      {
        id: "c",
        speaker: "Court Lady Oh-my",
        text: "The Queen Mother takes her tea within the hour. No girl serves her without passing my questions.",
      },
      {
        id: "q1",
        speaker: "Court Lady Oh-my",
        text: "First. A prince passes you in the courtyard. What do you do?",
        choices: [
          { text: "Bow low and wish him a good day.", next: "q1_kind", meter: 2 },
          { text: "Ask for a selfie. Politely.", next: "q1_funny", meter: 1 },
        ],
      },
      {
        id: "q1_kind",
        speaker: "Court Lady Oh-my",
        text: "Hm. Correct. Humble, and you meant it.",
        next: "q2",
      },
      {
        id: "q1_funny",
        speaker: "Court Lady Oh-my",
        text: "A self... what? Never mind. You said 'politely'. I'll allow it.",
        next: "q2",
      },
      {
        id: "q2",
        speaker: "Court Lady Oh-my",
        text: "Second. The Queen Mother says her tea is cold. You say?",
        choices: [
          { text: "I'll warm it at once, Your Majesty.", next: "q2_kind", meter: 2 },
          { text: "Respectfully, it's iced tea. It's a trend.", next: "q2_funny", meter: 1 },
        ],
      },
      { id: "q2_kind", speaker: "Court Lady Oh-my", text: "Good. Quick, quiet, no excuses.", next: "q3" },
      {
        id: "q2_funny",
        speaker: "{m7}",
        text: "She's going to get us all exiled to an island. Wonderful. I'll pack.",
        next: "q3",
      },
      {
        id: "q3",
        speaker: "Court Lady Oh-my",
        text: "Last. The masked 4th prince looks at you across the courtyard. Everyone else runs. You?",
        choices: [
          { text: "Look back, gently. Everyone deserves to be seen.", next: "q3_kind", meter: 2 },
          { text: "Stare back harder. I never lose a staring contest.", next: "q3_funny", meter: 1 },
        ],
      },
      {
        id: "q3_kind",
        speaker: "Court Lady Oh-my",
        text: "...No one has ever said that about Prince Wang Sooo. Hm. Interesting.",
        next: "done",
      },
      {
        id: "q3_funny",
        speaker: "Court Lady Oh-my",
        text: "Brave. Foolish. The two are cousins in this palace.",
        next: "done",
      },
      {
        id: "done",
        speaker: "Court Lady Oh-my",
        text: "You pass. Barely. Go up the steps to the Great Hall, and do NOT spill.",
        set: "etiquette_done",
      },
      { id: "e", speaker: "{m1}", text: "Spill? Me? I've never spilled anything in my— okay, a few things." },
    ],
    ohmy_after: [
      {
        id: "a",
        speaker: "Court Lady Oh-my",
        text: "Why are you still here? The Hall. Tea. Go. Small steps.",
      },
    ],
    chae: [
      {
        id: "a",
        speaker: "Court Lady Chae",
        text: "Did you hear? The 4th prince, Wang Sooo, came back from the north. He wears a mask. Always.",
      },
      {
        id: "b",
        speaker: "Court Lady Chae",
        text: "They say he's cold. They say he hisses at people. Like a cat.",
      },
      { id: "c", speaker: "{m1}", text: "...Like a cat. Ha. Haha. No. Lots of people hiss. Probably." },
    ],
    chae_after: [
      {
        id: "a",
        speaker: "Court Lady Chae",
        text: "He grabbed your WRIST? In FRONT of the Hall? I'm going to faint. I'm writing this down.",
      },
    ],
    guard: [
      {
        id: "a",
        speaker: "Palace Guard",
        text: "Halt. The Great Hall is for princes and proper court ladies.",
      },
      { id: "b", speaker: "{m8}", text: "I'm a prince. These are my friends. Legally that makes them fine." },
      {
        id: "c",
        speaker: "Palace Guard",
        text: "Nice try, small prince. The lady needs Court Lady Oh-my's word.",
      },
    ],
    guard_after: [
      {
        id: "a",
        speaker: "Palace Guard",
        text: "Oh-my says you passed. Up the steps. And mind the hem; it's longer than you think.",
      },
    ],
    servant: [
      {
        id: "a",
        speaker: "Little Eunuch Bok",
        text: "Court lady! A little round animal ran past and dropped this under the cherry tree. It's addressed to a '{m2.given}-hyung'?",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "That's MINE. That's— I wrote that. Last night. In a different century. Give.",
      },
      {
        id: "c",
        text: "'{m2.given}-hyung. I bet you'd look good in a mask. That's not the thing I wanted to say. The thing is next time. -{m1.initial}' ... Quokka Note 3 collected.",
        set: "note_3",
        meter: 2,
      },
      {
        id: "d",
        speaker: "{m7}",
        text: "'Next time.' You've written 'next time' in three centuries now.",
      },
      { id: "e", speaker: "{m1}", text: "AND IT WILL BE NEXT TIME. Eventually. Shush." },
    ],
    servant_after: [
      {
        id: "a",
        speaker: "Little Eunuch Bok",
        text: "I didn't read it. I only read the '{m2.given}-hyung' part. And the rest. Sorry, court lady.",
      },
    ],
    hall_intro: [
      {
        id: "a",
        text: "The Great Hall. Lacquer, silk, mountains in the windows. On the dais, a woman with a crown and a very small smile.",
      },
      {
        id: "b",
        speaker: "{m4}",
        text: "Gold light from the left, cold light from the right. This is a villain's lighting setup. I know my lighting.",
      },
    ],
    tea_lady: [
      {
        id: "a",
        speaker: "Court Lady Min",
        text: "The Queen Mother's cup must be exactly full. Not almost. Not over. Exactly.",
      },
      {
        id: "b",
        speaker: "Court Lady Min",
        text: "The last girl who overpoured is now a gardener. On an island.",
      },
      {
        id: "c",
        speaker: "{m1}",
        text: "Exactly full. Exactly full. I can do exactly. I'm an exact person.",
      },
    ],
    yoohoo_tea: [
      {
        id: "a",
        speaker: "Queen Mother Yoo-hoo",
        text: "A new girl. With a boy's walk and a sparrow's nerves. Pour, child. Let us see what you are.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "Pouring! Yes! Pouring is my... thing. One of my things. I have several.",
      },
      {
        id: "c",
        text: "{m1} lifts the celadon teapot.",
        action: {
          kind: "minigame",
          spec: TEA_POUR,
          onWin: "tea_won",
          onLose: "tea_lost",
        },
      },
    ],
    yoohoo_tea_again: [
      {
        id: "a",
        speaker: "Queen Mother Yoo-hoo",
        text: "Back again, little puddle-maker? Dry robes are on their way. Pour. Properly, this time.",
      },
      {
        id: "b",
        text: "{m1} lifts the celadon teapot. Steady hands. Steady. STEADY.",
        action: {
          kind: "minigame",
          spec: TEA_POUR,
          onWin: "tea_won",
          onLose: "tea_lost",
        },
      },
    ],
    tea_lost: [
      { id: "a", text: "SPLASH. Hot tea, all over the royal silk." },
      { id: "b", speaker: "Queen Mother Yoo-hoo", text: "..." },
      {
        id: "c",
        speaker: "{m1}",
        text: "I'M SO SORRY. It's fine! It's a pattern now! Very modern! I'll try again!",
      },
      {
        id: "d",
        speaker: "{m7}",
        text: "Breathe. Watch the cup, not her face. Talk to her again when you're ready.",
      },
    ],
    tea_won: [
      { id: "a", text: "Three cups. Exactly full. Not a drop on the silk." },
      {
        id: "b",
        speaker: "Queen Mother Yoo-hoo",
        text: "...Too perfect. No court lady pours like that on her first day. You are a spy from the future.",
      },
      { id: "c", speaker: "{m1}", text: "That's— okay that's weirdly accurate, but in a NICE way—" },
      {
        id: "d",
        speaker: "Queen Mother Yoo-hoo",
        text: "Guards. Take the girl and her pretty princes away.",
        action: { kind: "battle", enemies: ["palace_guard", "palace_guard"], then: "guards_won" },
      },
    ],
    guards_won: [
      { id: "a", speaker: "Queen Mother Yoo-hoo", text: "More guards. MORE. Bring the whole wall." },
      { id: "b", text: "Footsteps from every door. Too many." },
      {
        id: "c",
        text: "Then a hand closes around {m1}'s wrist. Cold silver mask. Black sleeve. A grip that doesn't ask.",
      },
      { id: "d", speaker: "???", text: "...Run. Now." },
      {
        id: "e",
        text: "The masked prince pulls {m1} out of the hall, down the steps, into the cherry blossoms.",
        set: "sooo_rescue",
        action: { kind: "warp", map: "palace", ...RESCUED },
      },
    ],
    yoohoo_waiting: [
      {
        id: "a",
        speaker: "Queen Mother Yoo-hoo",
        text: "Ah, the girl who runs away with masked princes. Come back when you've decided to lose properly.",
      },
    ],
    sooo: [
      { id: "a", speaker: "Wang Sooo", text: "..." },
      {
        id: "b",
        speaker: "{m1}",
        text: "Th-thank you. For the... wrist. The rescue. The wrist rescue. Your Highness.",
      },
      { id: "c", speaker: "Wang Sooo", text: "You talk too much for a court lady." },
      { id: "d", speaker: "{m1}", text: "And you talk too LITTLE for a— wait. Do you have... cat ears?" },
      { id: "e", speaker: "Wang Sooo", text: "No." },
      {
        id: "f",
        speaker: "{m7}",
        text: "It's obviously—",
      },
      {
        id: "g",
        speaker: "{m4}",
        text: "Shh. Let him have the drama. Some of us have waited three chapters for this.",
      },
      {
        id: "h",
        speaker: "Wang Sooo",
        text: "The Queen Mother has something that glows. In her sleeve. I want it gone. You want it. So. Together.",
      },
      {
        id: "i",
        speaker: "{m8}",
        text: "Four's a party, five's a crowd. I'll stay out here with the court ladies. They have rice cakes.",
      },
      { id: "j", speaker: "{m7}", text: "You're abandoning us for snacks." },
      {
        id: "k",
        speaker: "{m8}",
        text: "Maknae privilege. It's legally binding. Go get your shard, noona-hyung.",
        set: "sooo_joined",
      },
      {
        id: "l",
        text: "Wang Sooo joins the party. {m8} stays behind to guard the rice cakes.",
        action: { kind: "party", members: ["m1", "m2", "m4", "m7"] },
      },
    ],
    m8_stays: [
      {
        id: "a",
        speaker: "{m8}",
        text: "Court Lady Chae says I'm the most handsome prince. I didn't even ask. I just stood here.",
      },
      {
        id: "b",
        speaker: "{m8}",
        text: "Somewhere {m6}-hyung is baking. I can smell it across centuries. Go on.",
      },
    ],
    yoohoo_boss: [
      {
        id: "a",
        speaker: "Queen Mother Yoo-hoo",
        text: "The girl returns, with my most disappointing grandson. Wang Sooo, you were always the quiet one.",
      },
      { id: "b", speaker: "Wang Sooo", text: "Still am. Give back what isn't yours." },
      {
        id: "c",
        speaker: "Queen Mother Yoo-hoo",
        text: "This little light? A man in a dark suit gave it to me. 'Keep them apart,' he said. 'Keep them quiet.'",
      },
      {
        id: "d",
        speaker: "{m1}",
        text: "Director Gwi. Of course. Even here. He has offices in EVERY century.",
      },
      {
        id: "e",
        speaker: "Queen Mother Yoo-hoo",
        text: "This palace runs on secrets, child. A feeling said out loud is a scandal. Kneel.",
      },
      {
        id: "f",
        speaker: "{m1}",
        text: "No. Not today. Not in a skirt this nice.",
        action: { kind: "battle", enemies: ["yoohoo"], music: "boss", then: "yoohoo_won" },
      },
    ],
    yoohoo_won: [
      { id: "a", speaker: "Queen Mother Yoo-hoo", text: "Impossible... a court lady... and a cat..." },
      {
        id: "b",
        text: "Something bright rolls out of her sleeve and across the floor. The third Lightstick Shard!",
        set: "shard_3",
      },
      { id: "c", speaker: "{m7}", text: "Three down. {fandom} knows we're counting." },
      { id: "d", text: "{m1} reaches for the shard. So does Wang Sooo. Their hands meet over it." },
      {
        id: "e",
        speaker: "{m1}",
        text: "Your Highness. Before anything else happens. Can I... see your face? Just once?",
        action: {
          kind: "cutscene",
          trope: "wrist_grab",
          title: "Trope: Wrist Grab, then Unmasking",
          caption: [
            "The masked prince catches {m1}'s wrist. He doesn't let go.",
            "The silver mask comes away. It's {m2.given}.",
            "They lean in. Closer. Closer.",
            "CRACK. Dating Ban lightning splits the hall.",
          ],
          still: "still_wrist_grab",
          video: "wrist_grab",
          then: "unmasked",
        },
      },
    ],
    unmasked: [
      { id: "a", speaker: "{m1}", text: "M-{m2.given}-hyung? It was YOU? The whole time? The CAT EARS—" },
      { id: "b", speaker: "{m2}", text: "...You poured very well." },
      {
        id: "c",
        text: "Red lightning crawls across the floor between them. A contract seal burns in the air: CLAUSE 7.",
      },
      { id: "d", speaker: "{m2}", text: "{m1}. Hold on to—" },
      {
        id: "e",
        text: "The floor opens like a page turning. {m1} falls one way. {m2.given} falls the other. The shard falls with {m4} and {m7}.",
        meter: 3,
      },
      {
        id: "f",
        speaker: "{m4}",
        text: "That was the best-lit near-kiss I've ever seen. And I'm furious about it.",
      },
      {
        id: "g",
        speaker: "{m7}",
        text: "Grab {m8}. Wherever this drops us, we find them again.",
        action: { kind: "chapter", chapter: "ch4" },
      },
    ],
  },
};
