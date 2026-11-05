// The whole main build as one JSON text: the golden tests record it and compare against it.
import { CAMPAIGN } from "@campaign";
import { COMPANIONS, MEMBERS } from "../src/data/members";
import { ENCORES } from "../src/data/encores";
import { ENEMIES } from "../src/data/enemies";
import { ITEMS } from "../src/data/items";
import { SKILLS } from "../src/data/skills";
import { FIGURES } from "../src/data/figures";
import { creditLines } from "../src/data/credits";

const JSON_INDENT = 1;
const STAMP_SAMPLE = 10;

export function dump(): string {
  const { meter, ...campaign } = CAMPAIGN;
  const everything = {
    campaign,
    meter: { ...meter, stampSample: meter.stamp(STAMP_SAMPLE) },
    members: MEMBERS,
    companions: COMPANIONS,
    skills: SKILLS,
    encores: ENCORES,
    items: ITEMS,
    enemies: ENEMIES,
    figures: FIGURES,
    creditsA: creditLines("A"),
    creditsB: creditLines("B"),
  };
  return JSON.stringify(everything, null, JSON_INDENT);
}
