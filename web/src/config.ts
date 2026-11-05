// The one place that reads the build-time settings; everything else imports from here.
export const SETTINGS = __SETTINGS__;
export const GAME_WIDTH = SETTINGS.game.width;
export const GAME_HEIGHT = SETTINGS.game.height;
export const MUSIC_VOLUME = SETTINGS.audio.music_volume;
export const MUSIC_FADE_MS = SETTINGS.audio.fade_ms;
export const START_VOLUME = SETTINGS.audio.start_volume;
