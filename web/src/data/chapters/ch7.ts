import type { Lane, RhythmSpec } from "../../minigames/types";
import type { Chapter } from "../types";

// The Solmoon Arena stage: rigging and the giant tiger screen above, the stage floor in rows 8 and 9, a lower
// catwalk at the front left of row 10. Everything else is wall. 20 columns by 11 rows of 32px over 640x360.
// Talking picks the first NPC in list order within 60px, so NPCs stand three cells apart, and Zoo-ey (whose
// only talking cell is also in reach of the leader) is listed before him.
const STAGE_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "######M..R..S..#####",
  "####...........Z####",
  "###C...#############",
];

const STAGE_SPAWN = { x: 9, y: 9 };
const MEDIUM = 64;
const LARGE = 96;

// The dance battle (docs/minigames.md): 120 bpm, 48 beats, pass at three in four. Six bars, each busier.
const DANCE_BPM = 120;
const DANCE_PASS = 0.75;
const DANCE_PATTERN = ["L...R...", "U...D...", "L.R.U.D.", "R.L.D.U.", "LR.UD.LR", "U.DR.LUD"].join("");
const LANES = new Set<string>(["L", "R", "U", "D", "."]);
const SODA_COUNT = 3;

function isLane(glyph: string): glyph is Lane {
  return LANES.has(glyph);
}

const DANCE_BATTLE: RhythmSpec = {
  kind: "rhythm",
  id: "saja_dance",
  title: "Dance Battle vs the Saja Boyz",
  bpm: DANCE_BPM,
  pattern: Array.from(DANCE_PATTERN).filter(isLane),
  passScore: DANCE_PASS,
};

export const CHAPTER: Chapter = {
  id: "ch7",
  title: "Chapter 7: KPop Demon Hunters",
  party: ["m2", "m4", "m6"],
  start: { map: "stage", ...STAGE_SPAWN },
  items: [{ id: "soda_pop", name: "Soda Pop", heal: 30, line: "cracks open a Soda Pop. It fizzes" }],
  enemies: [
    {
      id: "demon_fan",
      name: "Demon Fan",
      art: "enemy_demon_fan",
      stats: { hp: 52, mp: 0, atk: 14, def: 6, mag: 7, spd: 13 },
      stayPoints: 30,
      color: 0x6a2a7a,
      width: MEDIUM,
      height: MEDIUM,
      // Read as "<name> <line> <target>!"
      lines: ["screams a stranger's name at", "swings a wrong-coloured lightstick at"],
    },
    {
      id: "saja_leader",
      name: "Saja Boyz Leader",
      art: "boss_saja_leader_boss",
      stats: { hp: 200, mp: 30, atk: 15, def: 9, mag: 12, spd: 13 },
      stayPoints: 240,
      color: 0x1a1a2e,
      width: LARGE,
      height: LARGE,
      lines: ["throws a move the Contract wrote at", "holds a note that pulls at"],
    },
  ],
  speakers: { Roomie: "hunter" },
  maps: {
    stage: {
      id: "stage",
      name: "The {barrier} Arena",
      backdrop: "backdrop_kpdh_stage",
      battle: "kpdh_battle",
      music: "kpdh",
      placeholder: 0x2a1a3e,
      grid: STAGE_GRID,
      onEnter: "stage_intro",
      encounters: {
        rate: 0.03,
        groups: [["demon_fan"], ["demon_fan", "demon_fan"], ["demon_fan", "fancam"]],
      },
      npcs: [
        {
          id: "roomie",
          name: "Roomie",
          figure: "npc_hunter_roomie",
          glyph: "R",
          dialogue: "roomie",
          variants: [
            { when: "shard_7", dialogue: "roomie_after" },
            { when: "met_hunters", dialogue: "roomie_again" },
          ],
        },
        {
          id: "meera",
          name: "Meera",
          figure: "npc_hunter_meera",
          glyph: "M",
          dialogue: "meera",
          variants: [{ when: "saja_turned", dialogue: "meera_after" }],
        },
        {
          id: "zooey",
          name: "Zoo-ey",
          figure: "npc_hunter_zooey",
          glyph: "Z",
          dialogue: "zooey",
          variants: [{ when: "got_soda", dialogue: "zooey_again" }],
        },
        {
          id: "saja_leader",
          name: "Saja Boyz Leader",
          figure: "npc_saja_leader",
          glyph: "S",
          dialogue: "saja_wait",
          variants: [
            { when: "saja_turned", dialogue: "saja_after" },
            { when: "met_hunters", dialogue: "saja_challenge" },
          ],
        },
        {
          id: "stagehand",
          name: "Stagehand",
          figure: "npc_stagehand",
          glyph: "C",
          dialogue: "stagehand",
          variants: [
            { when: "note_7", dialogue: "stagehand_after" },
            { when: "duet_done", dialogue: "stagehand_note" },
          ],
        },
      ],
      warps: [],
    },
  },
  dialogues: {
    stage_intro: [
      {
        id: "a",
        text: "A stadium stage at the edge of the Dramaverse. A tiger the size of a building glows on the screen.",
      },
      { id: "b", text: "Ten thousand lightsticks in the dark. Every one of them flickering." },
      {
        id: "c",
        speaker: "{m6}",
        text: "Good morning, arena! ...Why is nobody cheering? They're just staring.",
      },
      {
        id: "d",
        speaker: "{m4}",
        text: "Gold spots, violet haze, a giant tiger. Whoever lit this has taste. And a secret.",
      },
      { id: "e", speaker: "{m2}", text: "...The fans aren't blinking." },
      { id: "f", text: "(Three hunters are arguing at the back of the stage. Ask them what's going on.)" },
    ],
    roomie: [
      {
        id: "a",
        speaker: "Roomie",
        text: "Oh! Civilians on stage? Thank you so much for coming tonight! Please exit in an orderly fashion!",
      },
      { id: "b", speaker: "{m2}", text: "No." },
      {
        id: "c",
        speaker: "Roomie",
        text: "...Okay. Honest answer. We're hunters. The band on next, the Saja Boyz? Demons. Every song drinks the crowd.",
      },
      {
        id: "d",
        speaker: "Roomie",
        text: "Hearts. Memories. Whatever makes a fan a fan. It pours into a crack in the {barrier}. Enough, and it breaks.",
      },
      { id: "e", speaker: "{m6}", text: "The {barrier}? That's {m1}'s! It's made of his songs!" },
      {
        id: "f",
        speaker: "Roomie",
        text: "Then you know what we lose. We dance them off this stage tonight. Who are you dancing for?",
        choices: [
          { text: "...Someone who isn't here.", next: "kind", meter: 2 },
          { text: "Whoever lets me pet the tiger.", next: "funny", meter: 1 },
        ],
      },
      { id: "kind", speaker: "{m2}", text: "...Someone who isn't here. That's all." },
      { id: "kind_b", speaker: "Roomie", text: "That's the best reason there is.", next: "end" },
      { id: "funny", speaker: "{m2}", text: "Whoever lets me pet the tiger." },
      { id: "funny_b", speaker: "Roomie", text: "Durpy? Durpy lets everyone pet him. He has no standards." },
      {
        id: "end",
        speaker: "Roomie",
        text: "Talk to Meera and Zoo-ey. When you're ready, challenge their leader. Center stage.",
        set: "met_hunters",
      },
    ],
    roomie_again: [
      {
        id: "a",
        speaker: "Roomie",
        text: "Center stage. And don't hold his eyes too long. That's how they get you.",
      },
      { id: "b", text: "({m2} decides to hold his eyes too long, out of spite.)" },
    ],
    roomie_after: [
      {
        id: "a",
        speaker: "Roomie",
        text: "The {barrier}'s holding. Golden, all the way round. Thank you for your hard work today!",
      },
      { id: "b", speaker: "{m6}", text: "That's the last shard, right? Seven! We can go home!" },
      {
        id: "c",
        speaker: "Roomie",
        text: "Through one more stage. Gwi will be at the last concert. Bring all eight of you. Bring the quokka.",
      },
      { id: "d", speaker: "{m2}", text: "...Obviously." },
      {
        id: "e",
        speaker: "{m4}",
        text: "Then let's go. Final concert. Our lighting this time.",
        action: { kind: "chapter", chapter: "finale" },
      },
    ],
    meera: [
      {
        id: "a",
        speaker: "Meera",
        text: "You three dance? Show me. ...No. Don't actually show me. We're on in five.",
      },
      {
        id: "b",
        speaker: "Meera",
        text: "Their leader picks the beat. You match it, arrow for arrow. Hit three in four or he keeps the crowd.",
      },
      { id: "c", text: "A huge blue tiger with a goofy grin flops down across {m2}'s feet." },
      { id: "d", speaker: "{m2}", text: "...Hi." },
      {
        id: "e",
        speaker: "Meera",
        text: "That's Durpy. He doesn't like anybody. ...Apparently he likes you. Gross.",
      },
    ],
    meera_after: [
      {
        id: "a",
        speaker: "Meera",
        text: "Never thought I'd see a Saja walk away from his king. I'm not crying. It's the haze.",
      },
    ],
    zooey: [
      { id: "a", speaker: "Zoo-ey", text: "Hiii! Before you go up, hydrate! Sussy, the drinks, please!" },
      {
        id: "b",
        text: "A magpie in a tiny hat drops three cans at your feet with enormous ceremony.",
      },
      {
        id: "c",
        speaker: "Zoo-ey",
        text: "Soda Pop! Hunter recipe. It puts the fizz back in you when you're running on empty.",
      },
      {
        id: "d",
        text: "Got 3 Soda Pop!",
        set: "got_soda",
        action: { kind: "give", item: "soda_pop", count: SODA_COUNT },
      },
    ],
    zooey_again: [
      {
        id: "a",
        speaker: "Zoo-ey",
        text: "Sussy says one more can and you'll float. Sussy lies. But she's fun about it.",
      },
      {
        id: "b",
        speaker: "Zoo-ey",
        text: "Psst. Their leader keeps looking out at the crowd like he owes it an apology. Weird, right?",
      },
    ],
    saja_wait: [
      {
        id: "a",
        speaker: "Saja Boyz Leader",
        text: "We're on in five. Autographs after the show. Souls during.",
      },
      { id: "b", speaker: "{m2}", text: "...Pass." },
    ],
    saja_challenge: [
      {
        id: "a",
        speaker: "Saja Boyz Leader",
        text: "The hunters sent backup? Three boys and a lot of hair.",
      },
      { id: "b", speaker: "{m4}", text: "Thank you." },
      {
        id: "c",
        speaker: "Saja Boyz Leader",
        text: "A dance battle, then. My beat, your feet. Lose, and your fans are ours too.",
      },
      { id: "d", speaker: "{m2}", text: "We don't lose at dancing." },
      {
        id: "e",
        text: "The house lights drop. The tiger on the screen roars. The beat kicks in.",
        action: { kind: "minigame", spec: DANCE_BATTLE, onWin: "dance_won", onLose: "dance_lost" },
      },
    ],
    dance_lost: [
      {
        id: "a",
        speaker: "Saja Boyz Leader",
        text: "Close. Not close enough. Again? I've got all night. I've got everyone's nights.",
      },
      {
        id: "b",
        speaker: "{m6}",
        text: "Hyung, we've got this. On the beat, not ahead of it!",
        action: { kind: "minigame", spec: DANCE_BATTLE, onWin: "dance_won", onLose: "dance_lost" },
      },
    ],
    dance_won: [
      {
        id: "a",
        text: "Out in the dark, the lightsticks blink back on. One by one, then all at once.",
        set: "dance_won",
      },
      {
        id: "b",
        speaker: "Saja Boyz Leader",
        text: "...They're cheering. For you. I forgot what that sounds like.",
      },
      {
        id: "c",
        text: "A red seal burns on his wrist. His chin jerks up, like a puppet's on a string.",
      },
      {
        id: "d",
        speaker: "Saja Boyz Leader",
        text: "Get back. The Contract says I fight you now. I don't get a vote.",
        action: { kind: "battle", enemies: ["saja_leader"], music: "boss", then: "saja_beaten" },
      },
    ],
    saja_beaten: [
      { id: "a", speaker: "Saja Boyz Leader", text: "...Stop. I'm done. I'm done fighting for him." },
      { id: "b", speaker: "{m2}", text: "Him." },
      {
        id: "c",
        speaker: "Saja Boyz Leader",
        text: "I signed for a voice, a long time ago. Everyone I sang to forgot me after. I called it the price of a stage.",
      },
      {
        id: "d",
        speaker: "Saja Boyz Leader",
        text: "I'm sorry. To every fan in this room. I'm not singing for him again.",
        set: "saja_turned",
        meter: 1,
      },
      {
        id: "e",
        text: "The tiger on the screen flickers out. A face takes its place. A face from a rooftop, a lifetime ago.",
      },
      {
        id: "f",
        speaker: "Director Gwi",
        text: "Clause Nine. A band belongs to its king. Defection voids the performer. Never the contract.",
      },
      { id: "g", speaker: "{m6}", text: "Director Gwi?! You're their... you're the demon king?!" },
      {
        id: "h",
        speaker: "Director Gwi",
        text: "Clause One. I am always the king. The agency. The Saja Boyz. Every stage in the Dramaverse.",
      },
      {
        id: "i",
        speaker: "Director Gwi",
        text: "Final Clause. The Contract is signed at the last concert. Eight seats are reserved. Front row.",
      },
      { id: "j", text: "Static. Above the stage, the air splits: the {barrier}, cracking wide." },
      {
        id: "k",
        speaker: "Roomie",
        text: "It's breaking! The barrier needs a song! Two voices, together, right now!",
      },
      { id: "l", speaker: "{m4}", text: "Then sing, {m2.given}." },
      { id: "m", speaker: "{m2}", text: "...It needs two. The other one isn't here." },
      {
        id: "n",
        speaker: "Fan",
        text: "WAIT! Up here! Someone's video-calling my phone from nowhere! He says he's 'a quokka, sort of'!",
      },
      { id: "o", text: "In the front row, a fan holds her phone up as high as it goes." },
      { id: "o2", speaker: "Stagehand", text: "Keep it up there! I'm patching you into the mains! GO!" },
      {
        id: "p",
        speaker: "{m1}",
        text: "Hello? Why is there an echo? Am I on a SPEAKER? Is that... {m2.given}-hyung? Is that you?",
      },
      { id: "q", speaker: "{m2}", text: "...{m1}. Sing with me." },
      {
        id: "r",
        speaker: "{m1}",
        text: "Now?! Here?! In front of... okay. Yes. Yes. Always yes.",
        action: {
          kind: "cutscene",
          trope: "duet",
          title: "Trope: The Duet",
          caption: [
            "One phone held high in a sea of lightsticks.",
            "{m2} sings his half toward a voice a world away.",
            "For one verse, it feels like {m1} is right beside him.",
          ],
          still: "still_duet",
          video: "duet",
          then: "duet_done",
        },
      },
    ],
    duet_done: [
      {
        id: "a",
        text: "The last note hangs in the air. The lightsticks blaze gold. The crack above the stage stitches shut.",
        set: "duet_done",
        meter: 3,
      },
      { id: "b", speaker: "{m1}", text: "Hyung? The signal's going... I'll see you at the..." },
      { id: "c", text: "The call drops." },
      { id: "d", speaker: "{m6}", text: "He sounded so close." },
      {
        id: "e",
        speaker: "{m4}",
        text: "Ten thousand people just watched that. {fandom} knows. Everyone knows.",
      },
      {
        id: "f",
        text: "A sliver of light drifts down into {m2}'s hands, warm and humming. Got the Lightstick Shard 'Golden'!",
        set: "shard_7",
      },
      {
        id: "g",
        speaker: "Roomie",
        text: "Golden. That's what you two sounded like. Find me when you're ready to go.",
      },
    ],
    saja_after: [
      {
        id: "a",
        speaker: "Saja Boyz Leader",
        text: "The others ran back to him. I'm staying. The hunters say I can sweep this stage until I'm forgiven.",
      },
      { id: "b", speaker: "{m2}", text: "...You'll be sweeping a long time." },
      { id: "c", speaker: "Saja Boyz Leader", text: "Good. I'd like that." },
    ],
    stagehand: [
      {
        id: "a",
        speaker: "Stagehand",
        text: "Who left a tray of brownies in the monitor booth? Smells amazing. Also a fire hazard.",
      },
      { id: "b", speaker: "{m6}", text: "Good morning! That's me. Have one. Have two." },
      { id: "c", speaker: "Stagehand", text: "...These are incredible. Fine. They stay. Mind the cables." },
    ],
    stagehand_note: [
      {
        id: "a",
        speaker: "Stagehand",
        text: "Funny thing. Right after your song, a paper plane flew out of the speaker stack. Speakers don't do that.",
      },
      { id: "b", text: "It's addressed in messy handwriting: '{m2.given}-hyung'." },
      {
        id: "c",
        text: "'I heard you. Through a stranger's phone, a whole world away. Next time, no phones. -{m1.initial}' ... Quokka Note 7 collected.",
        set: "note_7",
        meter: 2,
      },
      { id: "d", speaker: "{m4}", text: "{m6}. {m6}, look. He's smiling." },
      { id: "e", speaker: "{m2}", text: "I'm not." },
    ],
    stagehand_after: [
      {
        id: "a",
        speaker: "Stagehand",
        text: "Mind the cables. And the brownies are gone. Professional hazard.",
      },
    ],
  },
};
