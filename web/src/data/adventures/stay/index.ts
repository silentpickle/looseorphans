// The L-Team's chapters, in play order. Every file here except this one and shared.ts exports CHAPTER.
import { fmtDeep } from "../../../cast";
import type { Chapter } from "../../types";
import { CHAPTER as STAY1 } from "./ch1";
import { CHAPTER as STAY2 } from "./ch2";
import { CHAPTER as STAY3 } from "./ch3";
import { CHAPTER as STAY4 } from "./ch4";
import { CHAPTER as STAY5 } from "./ch5";

const LIST: readonly Chapter[] = [STAY1, STAY2, STAY3, STAY4, STAY5];

export const STAY_CHAPTERS: Record<string, Chapter> = fmtDeep(
  Object.fromEntries(LIST.map((chapter) => [chapter.id, chapter])),
);
export const STAY_ORDER: readonly string[] = LIST.map((chapter) => chapter.id);
