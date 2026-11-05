import type { Action, Chapter } from "../types";

// Dong-un's baduk room: back wall and window down to row 6, the low table in the middle, the bowl shelves on the
// right. The floor is the wooden boards in front. 20 columns by 11 rows of 32px over the 640x360 screen.
const BADUK_GRID: readonly string[] = [
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "##.....#####.....###",
  "#....D.#####......##",
  "..................##",
  ".........v........##",
];

// The weather studio: the left wall slants down to row 5, the desk and the big screen fill the middle-right, the
// monitor box and two cameras stand along the bottom. The rounded stage in front of the desk is floor.
const STUDIO_GRID: readonly string[] = [
  "####################",
  "####################",
  "#####I..############",
  "####......##########",
  "##........##########",
  "#..F......#####.Y.##",
  "..........#####.....",
  "###..............###",
  "###.###.....D....###",
  "###.###C.........###",
  "....###...v......###",
];

const BADUK_SPAWN = { x: 9, y: 9 };
const STUDIO_SPAWN = { x: 10, y: 9 };
const BOSS_SIZE = 96;
const ENEMY_SIZE = 64;

// White stones (o) are hers, black (x) are yours. One big group with an eye inside and a lonely stone in the
// corner: seven open doors in all, and eight stones to close them.
const BADUK_PUZZLE: Action = {
  kind: "minigame",
  spec: {
    kind: "grid",
    id: "glory_baduk",
    title: "Surround her stones",
    rule: "surround",
    grid: [".ooo..", "xo.ox.", ".xoo..", "..x...", ".....o"],
    moves: 8,
  },
  onWin: "baduk_won",
  onLose: "baduk_lost",
};

export const CHAPTER: Chapter = {
  id: "ch4",
  title: "Chapter 4: The Glory",
  party: ["m4", "m7", "m8", "m6"],
  start: { map: "baduk", ...BADUK_SPAWN },
  speakers: { "Moon Dong-un": "dongun", "Park Yeon-jinx": "yeonjinx" },
  enemies: [
    {
      id: "glory_weather_sprite",
      name: "Weather Sprite",
      art: "enemy_weather_sprite",
      stats: { hp: 46, mp: 0, atk: 13, def: 5, mag: 10, spd: 13 },
      stayPoints: 26,
      color: 0x6fa8dc,
      width: ENEMY_SIZE,
      height: ENEMY_SIZE,
      lines: ["drizzles on your snacks", "rolls in like a cold front"],
    },
    {
      id: "glory_sasaeng",
      name: "Sasaeng Shade",
      art: "enemy_sasaeng",
      stats: { hp: 52, mp: 0, atk: 14, def: 6, mag: 4, spd: 15 },
      stayPoints: 30,
      color: 0x3d3d5c,
      width: ENEMY_SIZE,
      height: ENEMY_SIZE,
      lines: ["peeks out from behind a pillar", "knows your schedule better than you"],
    },
    {
      id: "yeonjinx",
      name: "Park Yeon-jinx",
      art: "boss_yeonjinx_boss",
      stats: { hp: 230, mp: 30, atk: 15, def: 9, mag: 13, spd: 12 },
      stayPoints: 200,
      color: 0xd9779f,
      width: BOSS_SIZE,
      height: BOSS_SIZE,
      lines: ["clicks to the next slide", "forecasts your bad day", "smiles for camera two"],
    },
  ],
  maps: {
    baduk: {
      id: "baduk",
      name: "Dong-un's Baduk Room",
      backdrop: "backdrop_glory_baduk",
      battle: "glory_battle",
      music: "glory",
      placeholder: 0x3a4a5c,
      grid: BADUK_GRID,
      onEnter: "baduk_intro",
      encounters: { rate: 0.02, groups: [["glory_sasaeng"]] },
      npcs: [
        {
          id: "dongun",
          name: "Moon Dong-un",
          figure: "npc_dongun",
          glyph: "D",
          dialogue: "dongun",
          facing: "right",
          variants: [{ when: "baduk_won", dialogue: "dongun_go" }],
        },
      ],
      warps: [{ glyph: "v", map: "studio", requires: "baduk_won", ...STUDIO_SPAWN }],
    },
    studio: {
      id: "studio",
      name: "Channel 9 Weather Studio",
      backdrop: "backdrop_glory_studio",
      battle: "glory_battle",
      music: "glory",
      placeholder: 0x5a5a66,
      grid: STUDIO_GRID,
      onEnter: "studio_intro",
      encounters: {
        rate: 0.03,
        groups: [["glory_weather_sprite"], ["glory_sasaeng"], ["glory_weather_sprite", "glory_sasaeng"]],
      },
      npcs: [
        {
          id: "yeonjinx",
          name: "Park Yeon-jinx",
          figure: "npc_yeonjinx",
          glyph: "Y",
          dialogue: "yeonjinx",
          hiddenWhen: "glory_done",
        },
        {
          id: "camera_op",
          name: "Camera Operator",
          figure: "npc_camera",
          glyph: "C",
          dialogue: "camera_op",
          facing: "left",
          variants: [{ when: "glory_done", dialogue: "camera_op_after" }],
        },
        {
          id: "floor_director",
          name: "Floor Director",
          figure: "npc_floor",
          glyph: "F",
          dialogue: "floor_director",
          variants: [{ when: "glory_done", dialogue: "floor_director_after" }],
        },
        {
          id: "intern",
          name: "Intern",
          figure: "npc_intern",
          glyph: "I",
          dialogue: "intern",
          variants: [{ when: "note_4", dialogue: "intern_again" }],
        },
        {
          id: "dongun_studio",
          name: "Moon Dong-un",
          figure: "npc_dongun",
          glyph: "D",
          dialogue: "dongun_end",
          shownWhen: "glory_done",
          facing: "down",
        },
      ],
      warps: [{ glyph: "v", map: "baduk", ...BADUK_SPAWN }],
    },
  },
  dialogues: {
    baduk_intro: [
      {
        id: "a",
        text: "A quiet room. Snow at the window. A baduk board mid-game, and nobody sitting at it.",
      },
      {
        id: "b",
        speaker: "{m4}",
        text: "Cold blue window, one warm lamp. Someone in here has been waiting a very long time.",
      },
      { id: "c", speaker: "{m7}", text: "Or someone forgot to pay the heating bill. Where are we?" },
      { id: "d", speaker: "{m8}", text: "{m6} found a kitchen in under a minute. Legally, that's a record." },
      {
        id: "e",
        speaker: "{m6}",
        text: "Good morning! It's night. Don't care. The oven's warm and there are brownies in twenty.",
      },
      { id: "f", text: "(A woman in black stands by the table. She hasn't looked up from the board.)" },
    ],
    dongun: [
      {
        id: "a",
        speaker: "Moon Dong-un",
        text: "You're the boys who fell out of the sky. I watched. I watch everything.",
      },
      { id: "b", speaker: "{m7}", text: "That's not as reassuring as you think it is." },
      {
        id: "c",
        speaker: "Moon Dong-un",
        text: "Park Yeon-jinx. Nine o'clock weather. She forecasts sunshine for herself and rain for everyone else.",
      },
      {
        id: "d",
        speaker: "Moon Dong-un",
        text: "She took something of yours. A glowing stick. She calls it her lucky pointer.",
      },
      { id: "e", speaker: "{m8}", text: "Our shard? She's using our shard as a weather clicker?" },
      {
        id: "f",
        speaker: "Moon Dong-un",
        text: "I don't chase her. I surround her. Sit.",
        choices: [
          { text: "Teach us.", next: "learn", meter: 2 },
          { text: "Just fight her?", next: "fight", meter: 1 },
        ],
      },
      { id: "learn", speaker: "Moon Dong-un", text: "Good. Patience is a move too.", next: "puzzle" },
      {
        id: "fight",
        speaker: "Moon Dong-un",
        text: "You could. She'd smile for camera two, and it would rain on you for a week.",
      },
      {
        id: "puzzle",
        speaker: "Moon Dong-un",
        text: "White is hers, black is yours. Close every door she has. Even the one she keeps inside.",
        action: BADUK_PUZZLE,
      },
    ],
    baduk_lost: [
      {
        id: "a",
        speaker: "Moon Dong-un",
        text: "Not yet. A door is any empty point touching her stones. The edge of the board is a wall.",
      },
      {
        id: "b",
        speaker: "{m7}",
        text: "Count them first. Then place. I'll pretend I did that the first time.",
      },
      {
        id: "c",
        speaker: "Moon Dong-un",
        text: "Again. I've lost to this board a thousand times. That's how I know where it ends.",
        action: BADUK_PUZZLE,
      },
    ],
    baduk_won: [
      { id: "a", text: "The last stone clicks down. Her stones have nowhere left to go." },
      {
        id: "b",
        speaker: "Moon Dong-un",
        text: "Eighteen years I practised that shape. You learned it in one evening.",
      },
      { id: "c", speaker: "{m4}", text: "Beginner's luck is just talent with good lighting." },
      {
        id: "d",
        speaker: "Moon Dong-un",
        text: "She goes live at nine. The studio is down the hall. Don't fight her forecast. Outlast it.",
        set: "baduk_won",
        meter: 1,
      },
    ],
    dongun_go: [
      { id: "a", speaker: "Moon Dong-un", text: "Nine o'clock. Down the hall. Patience." },
      { id: "b", speaker: "{m6}", text: "I'm bringing the brownies. Live TV needs snacks." },
    ],
    studio_intro: [
      { id: "a", text: "A TV studio. ON AIR glows red. A giant weather map fills the back wall." },
      {
        id: "b",
        speaker: "Park Yeon-jinx",
        text: "Good evening! Tonight: sunshine over me, and a ninety percent chance of disappointment over you.",
      },
      {
        id: "c",
        speaker: "{m7}",
        text: "Look at the map. That high-pressure system is shaped like a quokka.",
      },
      { id: "d", speaker: "{m4}", text: "...It's waving. Weather doesn't wave." },
      {
        id: "e",
        speaker: "{m8}",
        text: "{m1}-hyung. He's in the forecast somehow. Somewhere this broadcast reaches.",
      },
      { id: "f", speaker: "{m6}", text: "Then let's get on TV. Loudly." },
    ],
    yeonjinx: [
      {
        id: "a",
        speaker: "Park Yeon-jinx",
        text: "Oh! Guests! Nobody books guests on my segment. Darlings, you're standing in my cold front.",
      },
      { id: "b", speaker: "{m7}", text: "You have our shard. You're using it as a clicker." },
      {
        id: "c",
        speaker: "Park Yeon-jinx",
        text: "Lucky pointer. I click, the weather obeys. Watch: scattered showers over the boy band.",
      },
      { id: "d", speaker: "{m8}", text: "We're indoors." },
      {
        id: "e",
        speaker: "Park Yeon-jinx",
        text: "Not for long, sweetheart. Tonight's forecast: you, losing. Back to you in the studio!",
        action: {
          kind: "battle",
          enemies: ["yeonjinx"],
          music: "boss",
          forecast: true,
          then: "yeonjinx_won",
        },
      },
    ],
    yeonjinx_won: [
      {
        id: "a",
        speaker: "Park Yeon-jinx",
        text: "No, no, no. This isn't in my forecast. It was on the cue cards!",
      },
      { id: "enter", text: "Moon Dong-un steps out from behind camera two. She was there the whole time." },
      {
        id: "b",
        speaker: "Moon Dong-un",
        text: "You only ever forecast tomorrow, Yeon-jinx. Nobody forecasts the long game.",
      },
      {
        id: "c",
        speaker: "Park Yeon-jinx",
        text: "Fine! Take the clicker! Director Gwi already has the next eighteen years booked anyway.",
      },
      { id: "d", speaker: "{m7}", text: "Director Gwi. Read us the fine print." },
      {
        id: "e",
        speaker: "Park Yeon-jinx",
        text: "The Dating Ban Contract. It gets signed in the room where it happens. After that, nobody confesses. Ever.",
      },
      {
        id: "f",
        speaker: "Park Yeon-jinx",
        text: "Clear skies forever. That's the extended outlook. Goodnight!",
      },
      {
        id: "g",
        speaker: "{m4}",
        text: "'The room where it happens.' That sounds like a different genre entirely.",
      },
      {
        id: "h",
        speaker: "Moon Dong-un",
        text: "Then you have somewhere to be. Go slowly. Win once.",
        action: {
          kind: "cutscene",
          trope: "long_game",
          title: "Trope: The Long Game",
          caption: [
            "Eighteen years of patience.",
            "Forty seconds of weather.",
            "One stone, exactly where she always said it would go.",
          ],
          still: "still_long_game",
          video: "long_game",
          then: "long_game_done",
        },
      },
    ],
    long_game_done: [
      {
        id: "a",
        text: "The broadcast cuts to colour bars. Yeon-jinx drifts off the map like a passing front.",
        set: "glory_done",
        meter: 3,
      },
      { id: "b", text: "Got the fourth Lightstick Shard!", set: "shard_4" },
      { id: "c", speaker: "{m6}", text: "Brownies for the crew! Everyone gets one. Even the weather." },
    ],
    dongun_end: [
      {
        id: "a",
        speaker: "Moon Dong-un",
        text: "I spent my whole life on one game. Don't spend yours waiting for the perfect moment.",
      },
      { id: "b", speaker: "{m4}", text: "Is that advice for us, or for someone who isn't here?" },
      {
        id: "c",
        speaker: "Moon Dong-un",
        text: "Tell the boy in the forecast. He's been waiting longer than he thinks.",
      },
      {
        id: "d",
        speaker: "{m7}",
        text: "The room where it happens. Whatever it is, we get there before the pen does.",
      },
      { id: "e", speaker: "{m8}", text: "Someone in the comments always knows the way. {fandom} knows." },
      {
        id: "f",
        speaker: "{m6}",
        text: "Then let's go. I packed the leftover brownies.",
        action: { kind: "chapter", chapter: "ch5" },
      },
    ],
    camera_op: [
      { id: "a", speaker: "Camera Operator", text: "Thirty seconds to air. Don't look into the lens." },
      { id: "b", speaker: "{m4}", text: "I was born looking into the lens." },
      { id: "c", speaker: "Camera Operator", text: "...Camera two likes you. Camera two likes nobody." },
    ],
    camera_op_after: [
      {
        id: "a",
        speaker: "Camera Operator",
        text: "Best ratings in years. The quokka cloud is trending. Nobody can find the guy who drew it.",
      },
    ],
    floor_director: [
      { id: "a", speaker: "Floor Director", text: "Quiet on set! You four aren't on the rundown." },
      { id: "b", speaker: "{m7}", text: "We end up on everybody's rundown eventually." },
      {
        id: "c",
        speaker: "Floor Director",
        text: "Fair. Tip from the crew: she changes the weather every turn. Rain helps magic, heat helps fists.",
      },
      {
        id: "d",
        speaker: "Floor Director",
        text: "Snow slows everyone, wind speeds everyone up. Don't panic. It always clears eventually.",
      },
    ],
    floor_director_after: [
      {
        id: "a",
        speaker: "Floor Director",
        text: "And we're out! ...Can someone tell me who's doing the weather tomorrow?",
      },
    ],
    intern: [
      {
        id: "a",
        speaker: "Intern",
        text: "Oh! Hi! I'm not supposed to talk. I found this taped behind the weather wall. It has a little quokka on it.",
      },
      {
        id: "b",
        text: "'{m2.given}-hyung. Saw a weather map shaped like me and laughed until I cried. You'd say it's not that funny. It is. -{m1.initial}' ... Quokka Note 4 collected.",
        set: "note_4",
        meter: 2,
      },
      {
        id: "c",
        speaker: "{m6}",
        text: "He's laughing. Wherever he is, he's laughing. That's really good.",
      },
    ],
    intern_again: [
      { id: "a", speaker: "Intern", text: "I didn't see anything. I'm an intern. I see nothing." },
    ],
  },
};
