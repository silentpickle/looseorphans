import type { Lane, RhythmSpec } from "../../minigames/types";
import type { Action, Chapter } from "../types";

// The Hamilsung street runs corner to corner: cobbles and pavement from the top left down to the bottom right,
// brick houses and the tavern on the right, a roof and a lamp on the left. The Room's door is the arched one at
// (15,8). 20 columns by 11 rows of 32px over the 640x360 screen (see reports/grids/hamilsung_street.png).
const STREET_GRID: readonly string[] = [
  "####################",
  "#N.#################",
  "##.#..##############",
  "##..P..#############",
  "##......############",
  "###....T############",
  "###......###########",
  "###........#########",
  "###......B..###^####",
  "####........#.R.####",
  "#####............###",
];

// The Room Where It Happens: back wall and fireplace along the top, the long table in the middle. The table and
// its front chair cut the floor in two; the play happens on the right, by the fire (reports/grids/hamilsung_room.png).
const ROOM_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "#...#########.######",
  "....#########B.K..##",
  "....#########.....##",
  ".....#######......##",
  "........#........v##",
];

const STREET_SPAWN = { x: 5, y: 9 };
const STREET_FROM_ROOM = { x: 15, y: 9 };
const ROOM_SPAWN = { x: 15, y: 10 };

// My Shot: four eight-beat verses, each denser than the last (2, 4, 6, then 8 notes).
const VERSE_ONE: readonly Lane[] = ["L", ".", ".", ".", "R", ".", ".", "."];
const VERSE_TWO: readonly Lane[] = ["U", ".", "D", ".", "L", ".", "R", "."];
const VERSE_THREE: readonly Lane[] = ["L", "R", ".", "U", "D", ".", "L", "R"];
const VERSE_FOUR: readonly Lane[] = ["U", "D", "L", "R", "U", "D", "L", "R"];

const MY_SHOT: RhythmSpec = {
  kind: "rhythm",
  id: "my_shot",
  title: "My Shot vs Burr-sung",
  bpm: 96,
  pattern: [...VERSE_ONE, ...VERSE_TWO, ...VERSE_THREE, ...VERSE_FOUR],
  passScore: 0.7,
};

const RAP_BATTLE: Action = { kind: "minigame", spec: MY_SHOT, onWin: "burr_won", onLose: "burr_lost" };

export const CHAPTER: Chapter = {
  id: "ch6",
  title: "Chapter 6: Hamilsung",
  party: ["m3", "m5", "m1"],
  start: { map: "street", ...STREET_SPAWN },
  speakers: { "Aaron Burr-sung": "burrsung", "King Geor-Gwi": "georgwi" },
  enemies: [
    {
      id: "redcoat",
      name: "Redcoat",
      art: "enemy_redcoat",
      stats: { hp: 52, mp: 0, atk: 14, def: 7, mag: 4, spd: 10 },
      stayPoints: 26,
      color: 0xa02a2a,
      width: 64,
      height: 64,
      lines: ["marches in perfect formation", "fires a strongly worded volley"],
    },
    {
      id: "clause",
      name: "Fine-Print Clause",
      art: "enemy_clause",
      stats: { hp: 44, mp: 0, atk: 12, def: 6, mag: 12, spd: 13 },
      stayPoints: 28,
      color: 0x3a3a52,
      width: 64,
      height: 48,
      lines: ["subsections at you", "adds an asterisk"],
    },
    {
      id: "burrsung",
      name: "Aaron Burr-sung",
      art: "boss_burrsung_boss",
      stats: { hp: 200, mp: 20, atk: 14, def: 9, mag: 10, spd: 12 },
      stayPoints: 140,
      color: 0x2e2e3a,
      width: 96,
      height: 96,
      lines: ["says fewer words, harder", "keeps his options open", "smiles in a way that says nothing"],
    },
    {
      id: "georgwi",
      name: "King Geor-Gwi",
      art: "boss_georgwi_boss",
      stats: { hp: 300, mp: 40, atk: 15, def: 10, mag: 14, spd: 11 },
      stayPoints: 220,
      color: 0x6a2a8a,
      width: 96,
      height: 96,
      lines: [
        "sends an armed battalion of feelings",
        "sings a breakup ballad at you",
        "promises you'll be back",
      ],
    },
  ],
  maps: {
    street: {
      id: "street",
      name: "Hamilsung, Wall-ish Street",
      backdrop: "backdrop_hamilsung_street",
      battle: "hamilsung_battle",
      music: "hamilsung",
      placeholder: 0x5a4a44,
      grid: STREET_GRID,
      onEnter: "street_intro",
      encounters: { rate: 0.03, groups: [["redcoat"], ["clause"], ["redcoat", "clause"]] },
      npcs: [
        {
          id: "mulgun",
          name: "Hercules Mul-gun",
          figure: "npc_tavern",
          glyph: "T",
          dialogue: "mulgun",
          variants: [
            { when: "burr_done", dialogue: "mulgun_after" },
            { when: "heard_room", dialogue: "mulgun_again" },
          ],
        },
        {
          id: "peggy",
          name: "Peggy Sky-ler",
          figure: "npc_colonial_woman",
          glyph: "P",
          dialogue: "peggy",
          variants: [{ when: "burr_done", dialogue: "peggy_after" }],
        },
        {
          id: "courier",
          name: "The Post Rider",
          figure: "npc_courier",
          glyph: "N",
          dialogue: "courier",
          variants: [{ when: "note_6", dialogue: "courier_after" }],
        },
        {
          id: "burrsung",
          name: "Aaron Burr-sung",
          figure: "npc_burrsung",
          glyph: "B",
          dialogue: "burrsung",
          variants: [{ when: "heard_room", dialogue: "burrsung_challenge" }],
          hiddenWhen: "burr_done",
        },
        {
          id: "redcoat",
          name: "Redcoat Sergeant",
          figure: "npc_redcoat",
          glyph: "R",
          dialogue: "redcoat",
          variants: [{ when: "burr_done", dialogue: "redcoat_summons" }],
          facing: "left",
          hiddenWhen: "door_open",
        },
      ],
      warps: [{ glyph: "^", map: "room", requires: "door_open", ...ROOM_SPAWN }],
    },
    room: {
      id: "room",
      name: "The Room Where It Happens",
      backdrop: "backdrop_hamilsung_room",
      battle: "hamilsung_battle",
      music: "hamilsung",
      placeholder: 0x3a2418,
      grid: ROOM_GRID,
      onEnter: "room_intro",
      npcs: [
        { id: "georgwi", name: "King Geor-Gwi", figure: "npc_georgwi", glyph: "K", dialogue: "georgwi" },
        {
          id: "burrsung_room",
          name: "Aaron Burr-sung",
          figure: "npc_burrsung",
          glyph: "B",
          dialogue: "burrsung_room",
          facing: "right",
          shownWhen: "burr_done",
        },
      ],
      warps: [{ glyph: "v", map: "street", ...STREET_FROM_ROOM }],
    },
  },
  dialogues: {
    street_intro: [
      {
        id: "a",
        text: "Cobblestones. Candle smoke. Somewhere down the street, a man in a tricorne is rhyming at a horse.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "{m3.nick}-hyung? {m5.nick}-hyung? It's {trio}! We're together! ...Why am I wearing a cravat?",
      },
      { id: "c", speaker: "{m5}", text: "It's a strong cravat. Chin up. Don't think. Lift." },
      {
        id: "d",
        speaker: "{m3}",
        text: "You okay, guys? Good. Yeon-jinx said the Contract gets signed in the room where it happens. This is the place.",
      },
      {
        id: "e",
        speaker: "A Townsman",
        text: "Good morrow, strangers, welcome to our street! / The King signs something tonight. Please wipe your feet.",
      },
      {
        id: "f",
        speaker: "{m1}",
        text: "Everyone RHYMES here. I can't rhyme on command! I mean I can. Professionally. Just not ON COMMAND!",
      },
      { id: "g", text: "(Find a way into the Room Where It Happens. The tavern keeper hears everything.)" },
    ],
    mulgun: [
      {
        id: "a",
        speaker: "Hercules Mul-gun",
        text: "Welcome to my tavern, sit and have a drink! / The King is in the Room. That's bad, I think.",
      },
      { id: "b", speaker: "{m3}", text: "How do we get in?" },
      {
        id: "c",
        speaker: "Hercules Mul-gun",
        text: "One man holds the summons: black hat, careful face. / Aaron Burr-sung. He's been standing in one place.",
      },
      { id: "d", speaker: "{m5}", text: "So we take it off him. Politely. With bars." },
      {
        id: "e",
        speaker: "Hercules Mul-gun",
        text: "A freckled boy left brownies, said 'good morning' at midnight. / Take them for the fight. He'd want you fed. That's right.",
      },
      {
        id: "f",
        text: "Got 2 {m6}'s Brownies! ({m6} is baking somewhere in the Dramaverse. Of course he is.)",
        set: "heard_room",
        action: { kind: "give", item: "brownie", count: 2 },
      },
    ],
    mulgun_again: [
      {
        id: "a",
        speaker: "Hercules Mul-gun",
        text: "Burr-sung's down the street, still waiting for his chance. / Beat him with your words. Or, failing that, a dance.",
      },
    ],
    mulgun_after: [
      {
        id: "a",
        speaker: "Hercules Mul-gun",
        text: "You beat him? Well done! I'd raise a glass to that. / I'd raise two glasses, but I only have one hat.",
      },
      { id: "b", speaker: "{m1}", text: "That doesn't— you know what, I respect it." },
    ],
    peggy: [
      {
        id: "a",
        speaker: "Peggy Sky-ler",
        text: "I'm the third sister! The other two get all the attention. / I mostly get a passing mention.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "I won't forget you. I forget my own lines, my own phone, my own NAME, but I won't forget you.",
      },
      {
        id: "c",
        speaker: "Peggy Sky-ler",
        text: "Sweet boy. A letter came for a '{m1.given}' at the post. / The redcoats took it. They read everyone's. They read the most.",
      },
      {
        id: "d",
        speaker: "{m1}",
        text: "A letter. For me. From... no. No, don't spiral. I'm fine! Totally fine!",
      },
    ],
    peggy_after: [
      {
        id: "a",
        speaker: "Peggy Sky-ler",
        text: "You're going in the Room? Tell them the third sister says hi. / They won't know who that is. I'll live. I'll get by.",
      },
    ],
    courier: [
      {
        id: "a",
        speaker: "The Post Rider",
        text: "Post rider! Letters carried, near and far! / The King reads every one. That's how things are.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "Could you carry one the King won't read? It's for someone. A hyung. A very specific hyung.",
      },
      {
        id: "c",
        speaker: "The Post Rider",
        text: "Fold it small and write it plain. / I'll ride it through the King's own rain.",
      },
      {
        id: "d",
        text: "{m1} writes fast, crosses out twice, and folds the paper into the shape of a quokka.",
      },
      {
        id: "e",
        text: "'{m2.given}-hyung. Everyone here says what they mean in rhyme. I'm going to say it in plain words. Soon. -{m1.initial}' ... Quokka Note 6 collected.",
        set: "note_6",
        meter: 2,
      },
      {
        id: "f",
        speaker: "{m5}",
        text: "...I'm not crying. It's the candle smoke. This whole city is candle smoke.",
      },
    ],
    courier_after: [
      {
        id: "a",
        speaker: "The Post Rider",
        text: "Your quokka's on its way. Don't ask how I know who it's for. Everyone knows. {fandom} knows.",
      },
    ],
    burrsung: [
      {
        id: "a",
        speaker: "Aaron Burr-sung",
        text: "Strangers. Loud ones. Say fewer words. Ideally none. / Then no one can quote you when it's done.",
      },
      { id: "b", speaker: "{m1}", text: "That's terrible advice. And also, technically, a lot of words." },
      { id: "c", speaker: "Aaron Burr-sung", text: "Hm." },
    ],
    burrsung_challenge: [
      {
        id: "a",
        speaker: "Aaron Burr-sung",
        text: "The summons? Mine. I've waited years for this. / You want it? Rap for it. And try not to miss.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "A rap battle. In a tricorne. My whole life has been leading to this exact hat.",
      },
      {
        id: "c",
        speaker: "{m3}",
        text: "{m1}, Bin, take the verses. I'll hold the beat. Just like the old studio nights.",
      },
      {
        id: "d",
        speaker: "{m5}",
        text: "Every verse gets faster. Breathe from the gut. Don't think. Lift.",
      },
      {
        id: "e",
        text: "MY SHOT: press the arrow on each beat as it reaches the line. Four verses, each one denser.",
        action: RAP_BATTLE,
      },
    ],
    burr_lost: [
      {
        id: "a",
        speaker: "Aaron Burr-sung",
        text: "Too many words, and half of them late. / Fewer words, better words. Go on. I can wait.",
      },
      { id: "b", speaker: "{m5}", text: "Shake it off. That was a warm-up set. Again." },
      { id: "c", text: "MY SHOT, take two.", action: RAP_BATTLE },
    ],
    burr_won: [
      {
        id: "a",
        speaker: "Aaron Burr-sung",
        text: "Every bar landed. How dare you be good. / We settle this properly, the way gentlemen should.",
      },
      {
        id: "b",
        speaker: "{m3}",
        text: "...He means a fight. Okay. Nobody gets hurt that doesn't have to.",
      },
      {
        id: "c",
        text: "Aaron Burr-sung draws a very polite sword!",
        action: { kind: "battle", enemies: ["burrsung"], music: "boss", then: "burr_beaten" },
      },
    ],
    burr_beaten: [
      {
        id: "a",
        speaker: "Aaron Burr-sung",
        text: "Take the summons. Go. I only ever wanted to be in the room.",
      },
      {
        id: "b",
        speaker: "{m1}",
        text: "...Then what are you going to do?",
        choices: [
          { text: "Come with us. Nobody should wait outside forever.", next: "kind", meter: 2 },
          { text: "Come with us. Bring snacks. Say fewer words.", next: "funny", meter: 1 },
        ],
      },
      {
        id: "kind",
        speaker: "Aaron Burr-sung",
        text: "...No one's ever held the door for me before. I'll follow. Quietly.",
        next: "d",
      },
      {
        id: "funny",
        speaker: "Aaron Burr-sung",
        text: "Fewer words. Finally, someone who listens. I'll follow. Quietly.",
        next: "d",
      },
      {
        id: "d",
        speaker: "{m3}",
        text: "There's a redcoat on the Room's door. Summons first, then the King.",
        set: "burr_done",
      },
    ],
    redcoat: [
      {
        id: "a",
        speaker: "Redcoat Sergeant",
        text: "Halt! No summons, no entry, by the King's decree! / That rhymes. I'm proud of it. You can't come in. Whee.",
      },
    ],
    redcoat_summons: [
      {
        id: "a",
        speaker: "Redcoat Sergeant",
        text: "A summons. Signed. Fine. But orders are clear: / Search every visitor. No feelings in here.",
      },
      {
        id: "b",
        speaker: "Redcoat Sergeant",
        text: "And what's this? A letter we lifted at the post. / 'For {m1.given}.' The King likes these the most.",
      },
      { id: "c", speaker: "{m1}", text: "That's mine. That's MINE. Give it back. GIVE IT BACK!" },
      {
        id: "d",
        text: "The redcoats close ranks around the letter!",
        action: { kind: "battle", enemies: ["redcoat", "redcoat"], then: "redcoat_won" },
      },
    ],
    redcoat_won: [
      { id: "a", text: "The sergeant drops the letter. {m1} catches it before it touches the cobbles." },
      {
        id: "b",
        speaker: "{m1}",
        text: "It's his handwriting. It's {m2.given}-hyung's handwriting.",
        action: {
          kind: "cutscene",
          trope: "intercepted_letter",
          title: "Trope: The Intercepted Letter",
          caption: [
            "A letter that was never meant for a king.",
            "{m1} reads it twice.",
            "Then a third time, slower.",
          ],
          still: "still_intercepted_letter",
          video: "intercepted_letter",
          then: "letter_read",
        },
      },
    ],
    letter_read: [
      { id: "a", text: "'{m1.given}-ah. I don't write letters. This is a letter. Don't make it weird.'" },
      {
        id: "b",
        text: "'The cats are fine. I'm fine. I'm not going anywhere. I'm good at waiting. So wait for me. -{m2.given}'",
      },
      {
        id: "c",
        speaker: "{m1}",
        text: "He said don't make it weird. I'm going to make it SO weird. I'm going to frame it. In GOLD.",
        choices: [
          { text: "Fold it into the pocket over your heart.", next: "kind", meter: 2 },
          { text: "Make {m5} guard it.", next: "funny", meter: 1 },
        ],
      },
      {
        id: "kind",
        speaker: "{m1}",
        text: "...Left pocket. Closest one. That's where it lives now.",
        next: "d",
      },
      {
        id: "funny",
        speaker: "{m5}",
        text: "I'll guard it with my life. With my traps. Nobody touches the letter.",
        next: "d",
      },
      {
        id: "d",
        speaker: "{m3}",
        text: "He's always been the one who waits for it. Let's not make him wait longer. The door's open.",
        set: "door_open",
        meter: 3,
      },
    ],
    room_intro: [
      {
        id: "a",
        text: "Candles. A long table. A contract with the quill already dipped. The Room Where It Happens.",
      },
      { id: "b", text: "By the fire stands a man in a crown so large it has its own weather." },
      {
        id: "c",
        speaker: "{m1}",
        text: "Okay. We're in the room. What happens in the room? Please say it's not signing.",
      },
      { id: "d", speaker: "Aaron Burr-sung", text: "It's signing." },
    ],
    burrsung_room: [
      {
        id: "a",
        speaker: "Aaron Burr-sung",
        text: "I'm in the room. It's smaller than I pictured. / It smells of wax and paperwork. I feel... depicted.",
      },
    ],
    georgwi: [
      {
        id: "a",
        speaker: "King Geor-Gwi",
        text: "Ah, little subjects, come to watch me sign? / How loyal. How lovely. Please form a line.",
      },
      { id: "b", speaker: "{m3}", text: "We came to stop it. Nobody signs away anybody's feelings." },
      {
        id: "c",
        speaker: "King Geor-Gwi",
        text: "Feelings? Oh, darling, I'm the king of the sad. / I write breakup ballads. The good ones. And bad.",
      },
      {
        id: "d",
        speaker: "King Geor-Gwi",
        text: "You'll leave, then you'll miss me, then you'll come crawling. / You'll be back. I've pre-written the bawling.",
      },
      { id: "e", speaker: "{m5}", text: "I hate that that almost rhymed. {m1}. {m3.nick}-hyung. Positions." },
      {
        id: "f",
        text: "King Geor-Gwi rises in a swirl of ermine and minor chords!",
        action: { kind: "battle", enemies: ["georgwi"], music: "boss", then: "georgwi_won" },
      },
    ],
    georgwi_won: [
      { id: "a", speaker: "King Geor-Gwi", text: "No... you can't just leave... you'll be BACK..." },
      { id: "b", speaker: "{m1}", text: "We'll be back. Just not for you." },
      { id: "c", text: "Then the candles un-melt. The quill lifts out of the ink. The room is rewinding." },
      {
        id: "d",
        text: "<< REWIND << That last turn again, from the other side of the table. The final blow lands. The King flinches.",
      },
      {
        id: "e",
        text: "And from here you see what you missed: a long grey hand on the King's shoulder, steadying the quill.",
      },
      {
        id: "f",
        speaker: "Director Gwi",
        text: "Clause 9(c). A king may sign on behalf of every heart in his room. He was never the signer. Only the pen.",
      },
      {
        id: "g",
        text: ">> PLAY >> Back to now. The hand is gone. So is the Contract, out the window, toward a far-off bassline.",
      },
      {
        id: "h",
        speaker: "King Geor-Gwi",
        text: "...Was I a puppet? I was a puppet. That's going in the ballad.",
      },
      {
        id: "i",
        text: "Where the Contract lay, something glows. Got the sixth Lightstick Shard!",
        set: "shard_6",
      },
      {
        id: "j",
        speaker: "{m1}",
        text: "Gwi's taking it somewhere with a stage. I can feel the bass from here. And {m2.given}-hyung's waiting.",
      },
      {
        id: "k",
        speaker: "{m3}",
        text: "Then we don't keep him waiting. {trio}, let's go.",
        action: { kind: "chapter", chapter: "ch7" },
      },
    ],
  },
};
