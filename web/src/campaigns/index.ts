// Every adventure this build can play, in the order the select screen lists them. Adding an adventure is one line
// here plus its own campaign file; docs/adventures/README.md is the checklist.
import { fmtDeep } from "../cast";
import { CAMPAIGN as MAIN } from "./main";
import { CAMPAIGN as STAY } from "./stay";
import type { Campaign } from "./types";

export interface Adventure {
  campaign: Campaign;
  /** One or two lines on the select screen. */
  blurb: string;
  /** The picture behind the select screen while this adventure is highlighted (a title backdrop key). */
  card: string;
}

export const ADVENTURES: readonly Adventure[] = fmtDeep([
  {
    campaign: MAIN,
    blurb: "Eight idols flung across the Dramaverse. One rooftop confession, interrupted for 70 minutes.",
    card: MAIN.title.backdrop,
  },
  {
    campaign: STAY,
    blurb:
      "Early 2027. {m2} is in a training camp in the pines. Seven idols, seven onesies, one van, no plan.",
    card: STAY.title.backdrop,
  },
]);

export const DEFAULT_ADVENTURE = MAIN.id;

export function adventureById(id: string): Adventure | undefined {
  return ADVENTURES.find((adventure) => adventure.campaign.id === id);
}
