// A campaign is one whole game on this engine (an adventure): its chapters, its words and where it keeps its save.
// Every build bundles them all (campaigns/index.ts); campaigns/active.ts picks the one a page plays.
import type { Chapter } from "../data/types";

/** The story meter: what it is called, how full it gets, where Ending A starts, and the cutscene stamp. */
export interface MeterRules {
  name: string;
  max: number;
  endingA: number;
  /** The small line under a trope cutscene, given the meter after the trope's award. */
  stamp: (meter: number) => string;
  /** True shows the meter as a gauge on the map. */
  hud: boolean;
}

export interface CreditsText {
  fallbackDedication: string;
  endingNames: { A: string; B: string };
  starring: readonly string[];
  apologies: readonly string[];
  footer: string;
  postCredits: string;
}

export interface Campaign {
  id: string;
  /** Title, dedication and maker, from this campaign's table in config.toml. */
  settings: { title: string; dedication: string; maker: string };
  subtitle: string;
  /** The title screen's music and art keys (also behind the credits). */
  title: { music: string; backdrop: string; logo: string };
  saveKey: string;
  volumeKey: string;
  startChapter: string;
  chapters: Readonly<Record<string, Chapter>>;
  order: readonly string[];
  meter: MeterRules;
  battle: { defeat: string; currency: string };
  credits: CreditsText;
}
