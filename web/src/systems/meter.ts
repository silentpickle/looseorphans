// The story meter (the Minsung meter, or the next game's own): tropes, notes and kind choices fill it; the last
// chapter reads it to pick an ending. Its size and threshold belong to the campaign.
import { CAMPAIGN } from "@campaign";
import type { MeterRules } from "../campaigns/types";

export const METER_MAX = CAMPAIGN.meter.max;
export const ENDING_A_THRESHOLD = CAMPAIGN.meter.endingA;

export type Ending = "A" | "B";

export function clampMeter(value: number): number {
  return Math.max(0, Math.min(METER_MAX, value));
}

/** The ending a meter earns under a campaign's rules. */
export function endingUnder(rules: Pick<MeterRules, "endingA">, meter: number): Ending {
  return meter >= rules.endingA ? "A" : "B";
}

export function endingFor(meter: number): Ending {
  return endingUnder(CAMPAIGN.meter, meter);
}
