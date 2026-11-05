// Loose Orphans: Legend of Minsung, the first game.
import { fmt, fmtDeep } from "../cast";
import { SETTINGS } from "../config";
import { CHAPTERS, CHAPTER_ORDER } from "../data/chapters";
import type { Campaign } from "./types";

const METER_MAX = 70;

export const CAMPAIGN: Campaign = fmtDeep({
  id: "main",
  settings: SETTINGS.game,
  subtitle: "a Final Fantasy for {fandom}",
  title: { music: "title", backdrop: "title_title", logo: "title_logo" },
  saveKey: "{slug}.save",
  volumeKey: "{slug}.volume",
  startChapter: "prologue",
  chapters: CHAPTERS,
  order: CHAPTER_ORDER,
  meter: {
    name: "{meter}",
    max: METER_MAX,
    endingA: 50,
    stamp: (meter) => fmt(`Drama Album +1    {meter} ${meter}/${METER_MAX}`),
    hud: false,
  },
  battle: { defeat: "Game over. {fandom} will wait for you.", currency: "{currency}" },
  credits: {
    fallbackDedication: "For our favourite {fandom}",
    endingNames: { A: "Ending A: The Confession", B: "Ending B: {fandom} Knows" },
    starring: ["{m3}", "{m2}", "{m5}", "{m4}", "{m1}", "{m6}", "{m7}", "{m8}"],
    apologies: [
      "When the Camellia Blooms",
      "Squid Game",
      "Scarlet Heart Ryeo",
      "The Glory",
      "Hamilton",
      "KPop Demon Hunters",
    ],
    footer: "No lyrics were harmed in the making of this game.",
    postCredits: "...{m5.pet} mops the stage.\n{m6} is still baking.\n\nTHE END",
  },
});
