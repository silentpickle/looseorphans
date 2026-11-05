import { fmtDeep } from "../cast";
import type { Member, MemberId } from "./types";

export const MEMBERS: Record<MemberId, Member> = fmtDeep({
  m1: {
    id: "m1",
    name: "{m1}",
    job: "Quokka Bard",
    stats: { hp: 70, mp: 30, atk: 11, def: 6, mag: 12, spd: 12 },
    skills: ["m1_a", "m1_b"],
    portrait: "portrait_m1",
  },
  m2: {
    id: "m2",
    name: "{m2}",
    job: "Cat Ninja",
    stats: { hp: 72, mp: 20, atk: 14, def: 7, mag: 8, spd: 16 },
    skills: ["m2_a", "m2_b"],
  },
  m3: {
    id: "m3",
    name: "{m3}",
    job: "Wolf Paladin",
    stats: { hp: 95, mp: 24, atk: 13, def: 10, mag: 9, spd: 9 },
    skills: ["m3_a", "m3_b"],
  },
  m4: {
    id: "m4",
    name: "{m4}",
    job: "Pictomancer",
    stats: { hp: 68, mp: 36, atk: 9, def: 6, mag: 15, spd: 11 },
    skills: ["m4_a", "m4_b"],
  },
  m5: {
    id: "m5",
    name: "{m5}",
    job: "Gym Monk",
    stats: { hp: 88, mp: 16, atk: 16, def: 9, mag: 5, spd: 10 },
    skills: ["m5_a"],
  },
  m6: {
    id: "m6",
    name: "{m6}",
    job: "Sunshine White Mage",
    stats: { hp: 66, mp: 40, atk: 8, def: 6, mag: 16, spd: 11 },
    skills: ["m6_a", "m6_b"],
  },
  m7: {
    id: "m7",
    name: "{m7}",
    job: "Puppy Scholar",
    stats: { hp: 70, mp: 32, atk: 10, def: 7, mag: 13, spd: 12 },
    skills: ["m7_a"],
  },
  m8: {
    id: "m8",
    name: "{m8}",
    job: "Fox Thief",
    stats: { hp: 65, mp: 22, atk: 12, def: 6, mag: 9, spd: 15 },
    skills: ["m8_a"],
  },
});

export const MEMBER_IDS = Object.keys(MEMBERS) as MemberId[];

/** The pet companion that trots after each member on the map (art/companions). */
export const COMPANIONS: Record<MemberId, string> = {
  m1: "quokka",
  m2: "bunny",
  m3: "wolf",
  m4: "ferret",
  m5: "pig_rabbit",
  m6: "chick",
  m7: "puppy",
  m8: "fox",
};
