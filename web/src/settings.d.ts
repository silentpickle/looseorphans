// Injected by vite.config.ts from ../config.toml. `__game` is the running game, exposed for QA drivers.
interface Window {
  __game?: Phaser.Game;
}
interface DifficultySettings {
  enemy_hp: number;
  enemy_damage: number;
  encounter_rate: number;
  encore_charge: number;
  minigame_window: number;
  minigame_extra_lives: number;
  rhythm_pass: number;
}

declare const __SETTINGS__: {
  game: {
    title: string;
    width: number;
    height: number;
    debug_chapter_skip: boolean;
    dedication: string;
    maker: string;
  };
  difficulty: {
    level: "easy" | "normal";
    easy: DifficultySettings;
    normal: DifficultySettings;
  };
  audio: { music_volume: number; fade_ms: number; start_volume: number };
  art: { backdrop_width: number; backdrop_height: number; portrait_size: number; lpc_frame: number };
};

/** Injected by vite.config.ts from ../cast.toml, overlaid by ../cast.local.toml when it exists. */
declare const __CAST__: {
  source: "defaults" | "local";
  game: { title: string; dedication: string };
  terms: Record<string, string | undefined>;
  members: Record<string, Record<string, string | undefined> & { name: string }>;
};
