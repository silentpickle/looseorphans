// Every chapter file in this folder exports CHAPTER; they are found automatically, so adding a chapter touches no
// shared file. The play order is fixed here and skips chapters that don't exist yet.
import { fmtDeep } from "../../cast";
import type { Chapter } from "../types";

const FILES = import.meta.glob<Chapter>(["./*.ts", "!./index.ts"], { eager: true, import: "CHAPTER" });
const ORDER: readonly string[] = ["prologue", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "finale"];

export const CHAPTERS: Record<string, Chapter> = fmtDeep(
  Object.fromEntries(Object.values(FILES).map((chapter) => [chapter.id, chapter])),
);
export const CHAPTER_ORDER: readonly string[] = ORDER.filter((id) => id in CHAPTERS);

/** The chapter after this one, or null at the end of what exists. */
export function nextChapter(id: string): string | null {
  const at = CHAPTER_ORDER.indexOf(id);
  return CHAPTER_ORDER[at + 1] ?? null;
}
