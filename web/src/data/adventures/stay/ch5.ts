import type { MinigameSpec } from "../../../minigames/types";
import type { Chapter, Enemy } from "../../types";
import { ONESIES, TRACK } from "./shared";

// The motor pool: the helicopter on its pad top left, Major Bunker's trolley in the middle, the rest of the crew
// along the bottom.
const MOTOR_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "###...H..........###",
  "###..............###",
  "##.......U........##",
  "##................##",
  "##..A...S...B..N..##",
  "##................##",
  "##................##",
  "####################",
];

// The hill above the camp at dawn: Sol at the top, the crew around, the Major coming up the path.
const HILL_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "#####.....S....#####",
  "####............####",
  "###..D........A..###",
  "###..............###",
  "##..L.........J...##",
  "##................##",
  "##.......M........##",
  "####################",
];

const MOTOR_SPAWN = { x: 9, y: 9 };
const HILL_SPAWN = { x: 12, y: 8 };
const MEDIUM = 64;
const LARGE = 96;

const TAKE_OFF: MinigameSpec = {
  kind: "timing",
  id: "stay_take_off",
  title: "Take-off (Jun has a licence)",
  prompt: "Pull up when the needle is level. It's a toy-drone licence.",
  rounds: 3,
  lives: 3,
  sweepsPerSecond: 1.0,
  window: 0.22,
  invert: false,
};

const ENEMIES: readonly Enemy[] = [
  {
    id: "stay_forklift",
    name: "Overeager Forklift",
    art: "enemy_stay_forklift",
    stats: { hp: 44, mp: 0, atk: 14, def: 7, mag: 2, spd: 9 },
    stayPoints: 24,
    color: 0xd9a53b,
    width: MEDIUM,
    height: MEDIUM,
    lines: ["beeps while reversing", "lifts you by the hood"],
  },
  {
    id: "stay_bunker",
    name: "Major Bunker",
    art: "boss_stay_bunker_boss",
    stats: { hp: 320, mp: 30, atk: 18, def: 11, mag: 10, spd: 10 },
    stayPoints: 260,
    color: 0x3b4a2f,
    width: LARGE,
    height: LARGE,
    lines: ["fires a ladle of soup", "rams with the soup trolley"],
  },
];

export const CHAPTER: Chapter = {
  id: "stay5",
  title: "Part 5: The Getaway",
  party: ["m2", "m3", "m6", "m7"],
  enemies: ENEMIES,
  costumes: ONESIES,
  speakers: { "Major Bunker": "stay_bunker", "Sergeant Whistle": "stay_whistle" },
  start: { map: "motor", ...MOTOR_SPAWN },
  maps: {
    motor: {
      id: "motor",
      name: "The motor pool",
      backdrop: "backdrop_stay_motor",
      battle: "stay_camp_battle",
      music: TRACK.chase,
      placeholder: 0x5a5a4a,
      grid: MOTOR_GRID,
      onEnter: "motor_intro",
      encounters: { rate: 0.02, groups: [["stay_forklift"], ["stay_forklift", "stay_forklift"]] },
      npcs: [
        {
          id: "heli",
          name: "The helicopter",
          image: "prop_stay_heli",
          glyph: "H",
          dialogue: "heli_locked",
          variants: [{ when: "bunker_done", dialogue: "heli" }],
        },
        {
          id: "bunker",
          name: "Major Bunker",
          figure: "stay_major",
          glyph: "U",
          dialogue: "bunker",
          hiddenWhen: "bunker_done",
        },
        { id: "m4", name: "{m4}", figure: "stay_m4", glyph: "A", dialogue: "ari_milk" },
        { id: "m1", name: "{m1}", figure: "stay_m1", glyph: "S", dialogue: "sol_motor" },
        { id: "m5", name: "{m5}", figure: "stay_m5", glyph: "B", dialogue: "bo_motor" },
        { id: "m8", name: "{m8}", figure: "stay_m8", glyph: "N", dialogue: "nico_motor" },
      ],
      warps: [],
    },
    hill: {
      id: "hill",
      name: "The hill above Camp Pinecone, dawn",
      backdrop: "backdrop_stay_hill",
      music: TRACK.reunion,
      placeholder: 0xd98a5a,
      grid: HILL_GRID,
      onEnter: "hill_intro",
      npcs: [
        {
          id: "m1",
          name: "{m1}",
          figure: "stay_m1",
          glyph: "S",
          dialogue: "sol_hill",
          variants: [{ when: "pass_reveal", dialogue: "reunion" }],
        },
        { id: "m3", name: "{m3}", figure: "stay_m3", glyph: "D", dialogue: "dae_hill" },
        { id: "m4", name: "{m4}", figure: "stay_m4", glyph: "A", dialogue: "ari_hill" },
        { id: "m6", name: "{m6}", figure: "stay_m6", glyph: "L", dialogue: "lio_hill" },
        { id: "m7", name: "{m7}", figure: "stay_m7", glyph: "J", dialogue: "jun_hill" },
        {
          id: "major",
          name: "Major Bunker",
          figure: "stay_major",
          glyph: "M",
          dialogue: "major_pass",
          variants: [{ when: "pass_reveal", dialogue: "major_after" }],
        },
      ],
      warps: [],
    },
  },
  dialogues: {
    motor_intro: [
      {
        id: "a",
        text: "The motor pool. Trucks, a forklift, and a small green helicopter with its door open.",
      },
      { id: "b", speaker: "{m6}", text: "No." },
      { id: "c", speaker: "{m3}", text: "Mate, the van's in the kimchi. It's the only way out." },
      { id: "d", speaker: "{m6}", text: "NO. It's on the whiteboard. In big letters. Or small letters. NO." },
      {
        id: "e",
        text: "Between the crew and the helicopter: a soup trolley the size of a tank. And a Major.",
      },
    ],
    bunker: [
      { id: "a", speaker: "Major Bunker", text: "Private {m2}. Seven animals. A van in my kimchi. Explain." },
      { id: "b", speaker: "{m2}", text: "...They're with me, sir." },
      { id: "c", speaker: "Major Bunker", text: "Then they can explain it to the TROLLEY." },
      {
        id: "d",
        text: "Major Bunker rolls out the soup trolley!",
        action: { kind: "battle", enemies: ["stay_bunker"], music: TRACK.boss, then: "bunker_won" },
      },
    ],
    bunker_won: [
      {
        id: "a",
        text: "The trolley tips over. A wave of soup rolls gently across the motor pool.",
        set: "bunker_done",
      },
      {
        id: "b",
        speaker: "Major Bunker",
        text: "...Wait. Private. Wait, I have to tell you some... I'm out of breath.",
      },
      { id: "c", speaker: "{m3}", text: "No time! Helicopter! Go go go!" },
    ],
    heli_locked: [{ id: "a", text: "The Major's soup trolley is parked right in front of the helipad." }],
    heli: [
      {
        id: "a",
        speaker: "{m6}",
        text: "I'm not getting in. {stay_fool} I am not getting in that helicopter.",
      },
      { id: "b", speaker: "{m4}", text: "Here. Warm banana milk. You've been up all night, {m6.nick}." },
      { id: "c", speaker: "{m6}", text: "...That's really nice of you. I'm still not... getting... in..." },
      { id: "d", text: "{m6} falls asleep standing up. {m5} carries him aboard like a sack of brownies." },
      { id: "e", speaker: "{m7}", text: "Strap in. I have a licence." },
      { id: "f", speaker: "{m2}", text: "For what." },
      {
        id: "g",
        speaker: "{m7}",
        text: "Small things. Kevin, take the co-pilot seat.",
        action: { kind: "minigame", spec: TAKE_OFF, onWin: "take_off_won", onLose: "take_off_lost" },
      },
    ],
    take_off_lost: [
      { id: "a", text: "The helicopter hops a metre and lands again, very politely." },
      { id: "b", speaker: "{m7}", text: "That was a test. Kevin, stop laughing." },
    ],
    take_off_won: [
      { id: "a", text: "The helicopter lifts. The camp tilts below. {m6} snores into {m5}'s shoulder." },
      {
        id: "b",
        text: "They rise over the pines as the sky goes pink.",
        action: {
          kind: "cutscene",
          trope: "stay_flight",
          title: "Caper: The Flight",
          caption: [
            "A small green helicopter. Eight idols. Seven onesies.",
            "{m6} sleeps through the whole thing.",
            "{m1} holds {m2}'s sleeve the entire way up.",
          ],
          still: "still_stay_flight",
          video: "stay_flight",
          then: "flight_done",
        },
      },
    ],
    flight_done: [
      { id: "a", text: "Jun lands on the hill above the camp. It's a surprisingly good landing.", meter: 3 },
      {
        id: "b",
        speaker: "{m7}",
        text: "Told you. Licence.",
        action: { kind: "warp", map: "hill", ...HILL_SPAWN },
      },
    ],
    ari_milk: [
      { id: "a", speaker: "{m4}", text: "I brought warm banana milk. For later. For a certain chick." },
    ],
    sol_motor: [
      {
        id: "a",
        speaker: "{m1}",
        text: "I'm right here. I'm not letting go of your sleeve. That's not a request.",
      },
    ],
    bo_motor: [
      { id: "a", speaker: "{m5}", text: "If that trolley tips, I'm lifting it. That's my whole job." },
    ],
    nico_motor: [
      {
        id: "a",
        speaker: "{m8}",
        text: "I found the helicopter keys. Legally. They were in the helicopter.",
      },
    ],
    hill_intro: [
      {
        id: "a",
        text: "The hill above Camp Pinecone. The sun is coming up over the pines. Everyone is breathing hard.",
      },
      { id: "b", speaker: "{m3}", text: "We did it. We actually did it. {stay_catch}" },
      { id: "c", speaker: "{m2}", text: "...Someone's coming up the hill." },
      { id: "d", text: "(Talk to the Major.)", action: { kind: "party", members: ["m2"] } },
    ],
    sol_hill: [
      {
        id: "a",
        speaker: "{m1}",
        text: "Is that the Major? Is he RUNNING? Hyung, I think he's running at us.",
      },
    ],
    dae_hill: [
      {
        id: "a",
        speaker: "{m3}",
        text: "Stay calm. Stand in front of the quokka. Nobody touches the quokka.",
      },
    ],
    ari_hill: [
      { id: "a", speaker: "{m4}", text: "Dawn. Golden hour. I couldn't have lit this better myself." },
    ],
    lio_hill: [{ id: "a", speaker: "{m6}", text: "(asleep) ...no helicopters... good morning..." }],
    jun_hill: [{ id: "a", speaker: "{m7}", text: "Legally, we are now in a lot of trouble. Kevin agrees." }],
    major_pass: [
      {
        id: "a",
        speaker: "Major Bunker",
        text: "Private... {m2}... I've been trying to... tell you... since the motor pool.",
      },
      { id: "b", text: "He holds out a slip of paper. A stamp on it. Today's date." },
      { id: "c", speaker: "Major Bunker", text: "Your weekend leave pass. It started at 06:00." },
      { id: "d", speaker: "{m2}", text: "..." },
      {
        id: "e",
        speaker: "Major Bunker",
        text: "You could have walked out the front gate, son. The gate your goose sat on.",
      },
      {
        id: "f",
        text: "Seven plush animals stare at the slip of paper. Nobody says anything for a very long time.",
      },
      { id: "g", speaker: "{m3}", text: "...Well. The plan still came together." },
      {
        id: "h",
        speaker: "{m7}",
        text: "I read the fine print of the service act. I did not read the fine print of his calendar.",
      },
      {
        id: "i",
        speaker: "Major Bunker",
        text: "Back by Sunday, 18:00. And... could I get a photo with the quokka? My daughter loves quokkas.",
        set: "pass_reveal",
      },
    ],
    major_after: [
      { id: "a", speaker: "Major Bunker", text: "Sunday. 18:00. And bring the van back for my kimchi." },
    ],
    reunion: [
      { id: "a", speaker: "{m1}", text: "So. You're free. For the weekend. Legally. Without us. We just..." },
      { id: "b", speaker: "{m2}", text: "{m1.given}. You came through a fence for me. In a quokka." },
      {
        id: "c",
        speaker: "{m1}",
        text: "Obviously! You said 'I miss' and then you just STOPPED!",
        ending: { A: "end_a", B: "end_b" },
      },
      {
        id: "end_a",
        text: "{m2} takes one earphone out of his pocket and holds it out.",
        action: {
          kind: "cutscene",
          trope: "stay_reunion",
          title: "Ending: The Plan Comes Together",
          caption: [
            "The hill. The sunrise. One pair of earphones, shared.",
            "{m2}: 'I miss you. That's the rest of the sentence.'",
            "{m1} doesn't say anything. For once. He doesn't have to.",
          ],
          still: "still_stay_reunion",
          video: "stay_reunion",
          then: "epilogue_a",
        },
      },
      {
        id: "end_b",
        text: "Before {m2} can answer, the whole camp comes over the top of the hill.",
        action: {
          kind: "cutscene",
          trope: "stay_gate",
          title: "Ending: The Whole Camp Is Watching",
          caption: [
            "A hundred recruits, a cook, a goose, and Sergeant Whistle.",
            "{m2} hugs the quokka in front of all of them.",
            "The Sergeant blows the whistle. Everybody claps.",
          ],
          still: "still_stay_gate_ending",
          video: "stay_gate_ending",
          then: "epilogue_b",
        },
      },
    ],
    epilogue_a: [
      {
        id: "a",
        speaker: "{m3}",
        text: "Right. Everybody back in the... the helicopter's Jun's now, isn't it.",
      },
      { id: "b", speaker: "{m7}", text: "Kevin's, technically." },
      { id: "c", speaker: "{m2}", text: "...Thanks. All of you. For the worst plan I've ever seen." },
      {
        id: "d",
        speaker: "{m1}",
        text: "Sunday, 18:00. I'm driving you back. In the van. With the rabbit on it.",
        action: { kind: "credits" },
      },
    ],
    epilogue_b: [
      {
        id: "a",
        speaker: "Sergeant Whistle",
        text: "PRIVATE {m2|upper}! ...Have a nice weekend. Bring the quokka on visiting day.",
      },
      { id: "b", speaker: "{m4}", text: "You saw that, right? Everyone saw that. {fandom} knows." },
      { id: "c", speaker: "{m7}", text: "{m4}. Who are you talking to?" },
      { id: "d", speaker: "{m4}", text: "The audience.", action: { kind: "credits" } },
    ],
  },
};
