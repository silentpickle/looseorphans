import type { MemberId } from "../../types";

// What the L-Team chapters share: the crew's onesies (LPC figures from tools/art/cast/stay.toml), music ids and the
// art keys of pictures the chapters share. The cues are the stay_* tracks (tools/media/adventures/stay/music.toml).
export const TRACK = {
  caper: "stay_caper", // the crew's theme
  build: "stay_caper",
  camp: "stay_camp", // a sneaky snare march
  chase: "stay_chase",
  reunion: "stay_reunion", // dawn on the hill
  battle: "battle",
  boss: "stay_boss",
} as const;

/** The van, as a pictured NPC (props/stay_van). */
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

/** The crew's portraits in their onesies (Rae's in fatigues), from tools/media/adventures/stay/images.toml. */
export const CREW_PORTRAITS: Readonly<Record<string, string>> = {
  "{m1}": "stay_m1",
  "{m2}": "stay_m2",
  "{m3}": "stay_m3",
  "{m4}": "stay_m4",
  "{m5}": "stay_m5",
  "{m6}": "stay_m6",
  "{m7}": "stay_m7",
  "{m8}": "stay_m8",
};
