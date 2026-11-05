// Every LPC figure a campaign uses: the members, every chapter's NPCs, costumes and escort guests. The boot scene
// loads exactly these.
import { CAMPAIGN } from "@campaign";
import type { Campaign } from "../campaigns/types";
import { MEMBER_IDS } from "./members";
import type { MemberId } from "./types";

export function figureList(campaign: Campaign): readonly string[] {
  const chapters = Object.values(campaign.chapters);
  const npcs = chapters.flatMap((chapter) =>
    Object.values(chapter.maps).flatMap((map) =>
      map.npcs.flatMap((npc) => (npc.figure === undefined ? [] : [npc.figure])),
    ),
  );
  const costumes = chapters.flatMap((chapter) => Object.values(chapter.costumes ?? {}));
  const guests = chapters.flatMap((chapter) => (chapter.guest === undefined ? [] : [chapter.guest.figure]));
  return [...new Set([...MEMBER_IDS, ...npcs, ...costumes, ...guests])];
}

export const FIGURES: readonly string[] = figureList(CAMPAIGN);

/** The figure a member wears in a chapter: a costume when the chapter gives one, else their own. */
export function figureFor(chapterId: string, member: MemberId): string {
  return CAMPAIGN.chapters[chapterId]?.costumes?.[member] ?? member;
}
