import type { MemberId } from "../../types";

// What the L-Team chapters share: the crew's onesies (LPC figures from tools/art/cast/stay.toml), music ids and the
// art keys of pictures not drawn yet. Until tools/media/adventures/stay/music.toml is generated, each caper cue borrows one of the first game's tracks;
// swap the value to the stay_* id once that track's mp3 is on disk.
export const TRACK = {
  caper: "overworld", // later stay_caper: the crew's theme, brass and funk drums
  build: "hamilsung", // later stay_caper
  camp: "squish", // later stay_camp: a snare march, sneaky
  chase: "kpdh", // later stay_chase: the getaway
  reunion: "ost_swell", // later stay_reunion: the dawn on the hill
  battle: "battle",
  boss: "boss", // later stay_boss
} as const;

/** The van, as a pictured NPC: a still once tools/art draws it, a stand-in square until then. */
export const VAN_IMAGE = "prop_stay_van";

/** From the crew reveal on, everyone wears his onesie; Rae wears his fatigues. */
export const ONESIES: Partial<Record<MemberId, string>> = {
  m1: "stay_m1",
  m2: "stay_m2_uniform",
  m3: "stay_m3",
  m4: "stay_m4",
  m5: "stay_m5",
  m6: "stay_m6",
  m7: "stay_m7",
  m8: "stay_m8",
};
