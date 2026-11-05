// The L-Team: the second adventure, a caper (docs/adventures/stay/story-bible.md). Seven idols in plush onesies
// spring an eighth from a fictional army camp, and find out at dawn that his weekend leave had already started.
import { fmt, fmtDeep } from "../cast";
import { SETTINGS } from "../config";
import { STAY_CHAPTERS, STAY_ORDER } from "../data/adventures/stay";
import type { Campaign } from "./types";

const METER_MAX = 30;
const ENDING_A = 24;

export const CAMPAIGN: Campaign = fmtDeep({
  id: "stay",
  settings: { title: "{stay_team|upper}", dedication: SETTINGS.game.dedication, maker: SETTINGS.game.maker },
  subtitle: "a caper for {fandom}",
  title: { music: "overworld", backdrop: "title_stay_title", logo: "title_stay_logo" },
  saveKey: "{slug}.stay.save",
  volumeKey: "{slug}.volume",
  startChapter: "stay1",
  chapters: STAY_CHAPTERS,
  order: STAY_ORDER,
  meter: {
    name: "{stay_meter}",
    max: METER_MAX,
    endingA: ENDING_A,
    stamp: (meter) => fmt(`The plan comes together +1    {stay_meter} ${meter}/${METER_MAX}`),
    hud: false,
  },
  battle: { defeat: "The plan fell apart. {fandom} believes in a second plan.", currency: "{currency}" },
  credits: {
    fallbackDedication: "For everyone waiting for someone to come home",
    endingNames: { A: "Ending A: The Plan Comes Together", B: "Ending B: The Whole Camp Is Watching" },
    starring: [
      "{m3} as {stay_m3}",
      "{m6} as {stay_m6}",
      "{m4} as {stay_m4}",
      "{m7} as {stay_m7}",
      "{m5} as {stay_m5}",
      "{m8} as {stay_m8}",
      "{m1} as {stay_m1}",
      "and {m2} as Private {m2}",
    ],
    apologies: ["The A-Team", "Every heist movie ever made", "Geese, everywhere"],
    footer:
      "Military service is real and it matters. This is a cartoon. No kimchi was harmed. Some was rehomed.",
    postCredits:
      "...Sunday, 17:59. A yellow van with a rabbit on the front pulls up at the gate.\nThe goose salutes.\n\nTHE END",
  },
});
