// The credits roll's text: pure data, so a test can pin it. The scene in scenes/credits.ts draws it.
import { CAMPAIGN } from "@campaign";
import type { Campaign } from "../campaigns/types";

export interface Line {
  text: string;
  kind: "title" | "head" | "body" | "gap";
}

function block(head: string, body: readonly string[]): Line[] {
  return [
    { text: head, kind: "head" },
    ...body.map((text): Line => ({ text, kind: "body" })),
    { text: "", kind: "gap" },
  ];
}

export function creditLinesFor(campaign: Campaign, ending: "A" | "B"): Line[] {
  const { settings, credits } = campaign;
  const dedication = settings.dedication.trim() === "" ? credits.fallbackDedication : settings.dedication;
  return [
    { text: settings.title, kind: "title" },
    { text: credits.endingNames[ending], kind: "body" },
    { text: "", kind: "gap" },
    { text: dedication, kind: "head" },
    { text: "", kind: "gap" },
    ...block("Starring", credits.starring),
    ...block("Made by", [settings.maker, "with Claude"]),
    ...block("Pictures", ["Drawn with PixelLab"]),
    ...block("Character sprites", [
      "The Liberated Pixel Cup artists",
      "(full list in assets/sprites/CREDITS.md)",
    ]),
    ...block("Music", ["Composed with Lyria"]),
    ...block("Cutscenes", ["Animated with Gemini"]),
    ...block("With love and apologies to", credits.apologies),
    { text: credits.footer, kind: "body" },
    { text: "", kind: "gap" },
    { text: "Thank you for playing.", kind: "head" },
  ];
}

/** The active campaign's credits. */
export function creditLines(ending: "A" | "B"): Line[] {
  return creditLinesFor(CAMPAIGN, ending);
}
