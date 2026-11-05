// The game with the tables its build has, so the whole-content tests check every chapter.
import { CAMPAIGN as MAIN } from "../src/campaigns/main";
import type { Campaign } from "../src/campaigns/types";
import { speakerTable } from "../src/data/art";
import { enemyTable } from "../src/data/enemies";
import { itemTable } from "../src/data/items";
import type { Chapter, Enemy, Item } from "../src/data/types";

export interface CampaignTables {
  campaign: Campaign;
  enemies: Record<string, Enemy>;
  items: Record<string, Item>;
  speakers: Readonly<Record<string, string>>;
}

export interface ChapterIn extends CampaignTables {
  chapter: Chapter;
}

export const CAMPAIGNS: readonly CampaignTables[] = [MAIN].map((campaign) => ({
  campaign,
  enemies: enemyTable(campaign.chapters),
  items: itemTable(campaign.chapters),
  speakers: speakerTable(campaign.chapters),
}));

export const ALL_CHAPTERS: readonly ChapterIn[] = CAMPAIGNS.flatMap((tables) =>
  Object.values(tables.campaign.chapters).map((chapter) => ({ ...tables, chapter })),
);
