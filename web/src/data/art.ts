import { CAMPAIGN } from "@campaign";
import { fmtDeep } from "../cast";
import type { Chapter } from "./types";

// Texture keys for the generated art. The boot scene loads art/manifest.json and keys each piece by its group.
export const MANIFEST_KEY = "art-manifest";
export const MANIFEST_URL = "assets/art/manifest.json";

/** Manifest group -> texture key prefix. */
export const GROUP_PREFIX: Readonly<Record<string, string>> = {
  backdrops: "backdrop",
  battles: "battlebg",
  portraits: "portrait",
  stills: "still",
  bosses: "boss",
  enemies: "enemy",
  pet: "pet",
  companions: "pet",
  props: "prop",
  title: "title",
};

export function artKey(group: string, id: string): string {
  return `${GROUP_PREFIX[group] ?? group}_${id}`;
}

/** Who speaks with which portrait. A speaker missing here talks without one. */
const SPEAKER_PORTRAITS: Readonly<Record<string, string>> = fmtDeep({
  "{m1}": "m1",
  "{m2}": "m2",
  "{m3}": "m3",
  "{m4}": "m4",
  "{m5}": "m5",
  "{m6}": "m6",
  "{m7}": "m7",
  "{m8}": "m8",
  "Director Gwi": "gwi",
  "Dong-baek-ish": "dongbaek",
  "Officer Yong-sick": "yongsick",
  "The Jester": "jester",
  "The Front Manager": "front_manager",
  "Queen Mother Yoo-hoo": "yoohoo",
  "Moon Dong-un": "dongun",
  "Park Yeon-jinx": "yeonjinx",
  Hosier: "hosier",
  "Aaron Burr-sung": "burrsung",
  "King Geor-Gwi": "georgwi",
  "Saja Boyz Leader": "saja_leader",
  "Golden Hunter": "hunter",
});

/** Speaker name -> portrait id: the shared table plus every chapter's own. */
export function speakerTable(chapters: Readonly<Record<string, Chapter>>): Readonly<Record<string, string>> {
  return Object.assign(
    {},
    SPEAKER_PORTRAITS,
    ...Object.values(chapters).map((chapter) => chapter.speakers ?? {}),
  ) as Record<string, string>;
}

const ALL_SPEAKERS = speakerTable(CAMPAIGN.chapters);

/** The portrait texture for a speaker in a table (the active campaign's by default). */
export function portraitFor(
  speaker: string | undefined,
  speakers: Readonly<Record<string, string>> = ALL_SPEAKERS,
): string | undefined {
  if (speaker === undefined) return undefined;
  const id = speakers[speaker];
  return id === undefined ? undefined : artKey("portraits", id);
}
