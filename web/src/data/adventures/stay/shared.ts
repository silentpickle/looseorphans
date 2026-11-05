// What the L-Team chapters share: music ids and the art keys of pictures not drawn yet.
// Until tools/media/adventures/stay/music.toml is generated, each caper cue borrows one of the first game's tracks;
// swap the value to the stay_* id once that track's mp3 is on disk.
export const TRACK = {
  caper: "overworld", // later stay_caper: the crew's theme, brass and funk drums
  build: "hamilsung", // later stay_caper
  camp: "squish", // later stay_camp: a snare march, sneaky
  chase: "kpdh", // later stay_chase: the getaway
  reunion: "ost_swell", // later stay_reunion: the dawn on the hill
  battle: "battle",
  boss: "boss",
} as const;

/** The van, as a pictured NPC: a still once tools/art draws it, a stand-in square until then. */
export const VAN_IMAGE = "prop_stay_van";
